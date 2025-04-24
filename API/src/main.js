import "dotenv/config";
import {readFileSync} from "fs";
import {randomBytes} from "node:crypto";
import Fastify from "fastify";
import Database from "better-sqlite3";

const numberOfDaysToShow = 35;
const rebootCodesMap = new Map();
const jobs = new Map();
const appServicesMap = new Map();
const runVersion = process.env.npm_package_version;
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

        // this.job = setInterval(() => this.updateServiceStatus(), this.jobInterval * 1000);
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
                this.errorHandler(res.status);
            }

            statusCode = res.status;
        } catch (e) {
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

        this.isAlive = false;
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
    const configData = JSON.parse(readFileSync("./src/apps_services.json", "utf8"));

    for (const [appKey, appData] of Object.entries(configData)) {
        let publicAppData = {
            name: appData.name,
            url: appData.visit_url,
            services: {}
        }

        for (const [serviceKey, serviceData] of Object.entries(appData.services)) {
            jobs.set(`${appKey}:${serviceKey}`, new JobConfig(appKey, serviceKey, serviceData.url, serviceData.interval));

            publicAppData.services[serviceKey] = serviceData.name;
        }

        appServicesMap.set(appKey, publicAppData);
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

fastify.get("/status", async () => {
    return {message: "Alive"};
});

fastify.get("/v1/apps-and-services", async () => {
    return {
        map: Object.fromEntries(appServicesMap),
        version: runVersion,
        days: numberOfDaysToShow,
    };
});

fastify.get("/v1/status/:app_id/:service_id", async (request, reply) => {
    const {app_id, service_id} = request.params;

    if (!jobs.has(`${app_id}:${service_id}`)) {
        reply.status(404);
        return {message: `Status check of ${app_id}-${service_id} not found`};
    }

    const jobConfig = jobs.get(`${app_id}:${service_id}`);
    const now = new Date().toISOString();

    // Hour
    const hoursStmt = db.prepare(`
        SELECT strftime('%Y/%m/%d %H', created_at)                 AS date_id,
               count(id)                                           AS total_checks,
               SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END)  AS total_success,
               SUM(CASE WHEN status_code != 200 THEN 1 ELSE 0 END) AS total_fail
        FROM status
        WHERE created_at > datetime(?, '-12 hours') AND app = ? AND service = ?
        GROUP BY date_id
        ORDER BY date_id DESC;
    `);

    const hoursData = hoursStmt.all(now, jobConfig.appName, jobConfig.serviceName);

    // Days
    const daysStmt = db.prepare(`
        SELECT date(created_at)                                    AS date_id,
               count(id)                                           AS total_checks,
               SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END)  AS total_success,
               SUM(CASE WHEN status_code != 200 THEN 1 ELSE 0 END) AS total_fail
        FROM status
        WHERE date(?, '-1 day') >= date_id AND date(?, '-${numberOfDaysToShow} day') <= date_id AND app = ? AND service = ?
        GROUP BY date_id
        ORDER BY date_id DESC;
    `);

    const daysData = daysStmt.all(now, now, jobConfig.appName, jobConfig.serviceName);

    // Uptime
    const uptimeStmt = db.prepare(`
        SELECT ROUND(SUM(CASE WHEN status_code = 200 THEN 1.0 ELSE 0.0 END) / count(id) * 100, 5) AS uptime_percentage
        FROM status
        WHERE created_at > datetime(?, '-45 days') AND app = ? AND service = ?
        GROUP BY app, service;
    `);

    let uptimeData = uptimeStmt.get(now, jobConfig.appName, jobConfig.serviceName);
    let uptimePercentage = null;
    if (uptimeData) {
        uptimePercentage = uptimeData.uptime_percentage;
    }

    reply.status(200);
    return {
        message: "Successfully got the status",
        isAlive: jobConfig.isAlive,
        isSuspended: jobConfig.isSuspended,
        hourData: hoursData,
        daysData: daysData,
        uptimePercentage: uptimePercentage,
    };
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