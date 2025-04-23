import Fastify from "fastify";
import Database from "better-sqlite3";
import {readFileSync} from "fs";
import "dotenv/config";
import {randomBytes} from "node:crypto";

const rebootCodesMap = new Map();
const jobs = new Map();
const fastify = Fastify({
    logger: true
});
const db = new Database("./data/status.sqlite");

class JobConfig {
    numErrors = 0;
    timeOfLastError = null;
    isSuspended = false;
    rebootCode = null;
    isAlive = false;

    constructor(appName, serviceName, url, jobInterval) {
        this.jobInterval = jobInterval;
        this.appName = appName;
        this.serviceName = serviceName;
        this.url = url;

        this.job = setInterval(() => this.updateServiceStatus(), this.jobInterval * 1000);
    }

    restartService() {
        if (!this.isSuspended || !this.rebootCode || this.job) {
            return true;
        }

        const stmt = db.prepare("UPDATE reboot_code SET was_used = TRUE WHERE id = ?");
        stmt.run(this.rebootCode);

        this.job = setInterval(() => this.updateServiceStatus(), this.jobInterval * 1000);
        this.isSuspended = false;
        this.numErrors = 0;

        rebootCodesMap.delete(this.rebootCode);
        this.rebootCode = null;

        return true;
    }

    async updateServiceStatus() {
        if (this.isSuspended) {
            return;
        }

        let statusCode = -1;

        try {
            const res = await fetch(this.url, {
                method: "GET",
                headers: {
                    "X-IS-MM-STATUS-JOB": "1",
                },
                signal: AbortSignal.timeout(5000),
            });

            if (res.status === 200) {
                this.isAlive = true;
            } else {
                this.isAlive = false;
                this.errorHandler(res.status);
            }

            statusCode = res.status;
        } catch (e) {
            this.isAlive = false;
            console.error(e);
            console.error(this.appName, this.serviceName, this.url, this.isSuspended, this.rebootCode, this.numErrors);
            this.errorHandler(-1);
        } finally {
            const stmt = db.prepare("INSERT INTO status (app, service, status_code, created_at) VALUES (?, ?, ?, ?)");
            stmt.run(this.appName, this.serviceName, statusCode, new Date().toISOString());
        }
    }

    async errorHandler(statusCode) {
        if (this.isSuspended) {
            return;
        }

        this.numErrors++;
        this.timeOfLastError = new Date();

        const embeds = [];

        if (this.numErrors > 3) {
            this.isSuspended = true;
            clearInterval(this.job);
            this.job = null;
            this.rebootCode = randomBytes(32).toString("hex");
            embeds.push({
                "title": `Service ${this.appName}-${this.serviceName} was suspended!`,
                "description": `This service was suspended because it reached a maximum of 3 errors. To restart it you must click the following link:\n
                https://status.miguelmagueijo.pt/api/v1/reboot/${this.rebootCode}`,
                "color": 7419530,
                "fields": [],
                "footer": {
                    "text": `Automated message`,
                }
            });

            console.warn(`Service ${this.serviceName} of ${this.appName} was suspended. Code to reboot job: ${this.rebootCode}`);

            const stmt = db.prepare("INSERT INTO reboot_code (id, app, service, created_at) VALUES (?, ?, ?, ?)");
            stmt.run(this.rebootCode, this.appName, this.serviceName, new Date().toISOString());

            rebootCodesMap.set(this.rebootCode, this);
        } else {
            const description = `Returned the following error status code \`${statusCode}\`.
                \n**Service link** (${this.url})\n
                [Status web page](https://status.miguelmagueijo.pt)`;

            embeds.push({
                "title": `${this.appName}-${this.serviceName} is down!`,
                "description": description,
                "color": 16711684,
                "fields": [],
                "footer": {
                    "text": `Automated message, error num.${this.numErrors}`,
                }
            });
        }

        try {
            await fetch(process.env.DISCORD_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "attachments": [],
                    "components": [],
                    "content": "",
                    "embeds": embeds
                })
            });
        } catch (e) {
            console.error(e);
        }
    }
}


async function startScrapJobs() {
    const configData = JSON.parse(readFileSync("./src/scrap_config.json", "utf8"));

    for (const conf of configData) {
        jobs.set(`${conf.app}:${conf.service}`, new JobConfig(conf.app, conf.service, conf.url, conf.interval));
    }
}

db.exec(`
    DROP TABLE IF EXISTS status;
    CREATE TABLE status
    (
        id          INTEGER PRIMARY KEY,
        app         TEXT     NOT NULL,
        service     TEXT     NOT NULL,
        status_code INTEGER  NOT NULL,
        created_at  DATETIME NOT NULL
    );
    CREATE INDEX idx_app_status ON status (app);
    CREATE INDEX idx_service_status ON status (service);

    DROP TABLE IF EXISTS reboot_code;
    CREATE TABLE reboot_code
    (
        id         TEXT PRIMARY KEY,
        app        TEXT     NOT NULL,
        service    TEXT     NOT NULL,
        was_used   BOOLEAN  NOT NULL DEFAULT FALSE,
        created_at DATETIME NOT NULL
    );
    CREATE INDEX idx_app_rebootCode ON reboot_code (app);
    CREATE INDEX idx_service_rebootCode ON reboot_code (service);
`);

fastify.get("/status", async (request, reply) => {
    return {message: "Alive"};
});

fastify.get("/v1/status/:app_id/:service_id", async (request, reply) => {
    const {app_id, service_id} = request.params;

    if (!jobs.has(`${app_id}:${service_id}`)) {
        reply.status(404);
        return {message: `Status check of ${app_id}-${service_id} not found`};
    }

    reply.status(500);
    return {message: "Not yet implemented"};
});

fastify.get("/v1/reboot/:code", async (request, reply) => {
    const {code} = request.params;

    if (!rebootCodesMap.has(code)) {
        reply.status(404);
        return {message: "Reboot code not found!"};
    }

    const jobConfig = rebootCodesMap.get(code);
    if (jobConfig.restartService()) {
        reply.status(200);
        return {message: `The status check of ${jobConfig.appName}-${jobConfig.serviceName} was successfully rebooted`};
    } else {
        reply.status(500);
        return {message: `Fail to reboot status check of ${jobConfig.appName}-${jobConfig.serviceName}`};
    }
});

const start = async () => {
    try {
        startScrapJobs();
        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();