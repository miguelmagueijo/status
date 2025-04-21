import Fastify from "fastify";
import Database from "better-sqlite3";
import { readFileSync } from "fs";

class JobConfig {
    numErrors = 0;
    timeOfLastError = null;

    constructor(jobID) {
        this.jobID = jobID;
    }
}

const registeredAppsServices = new Map();
const jobs = {};
const fastify = Fastify({
    logger: true
});
const db = new Database("./data/status.sqlite");


async function updateServiceStatus(url, app_id, service_id) {
    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "X-IS-MM-STATUS-JOB": "1",
            },
        });

        if (res.status === 200) {
            console.log("Success for ", app_id, service_id);
        } else {
            console.error("Error for ", app_id, service_id);
        }

        const stmt = db.prepare("INSERT INTO status (app, service, status_code, created_at) VALUES (?, ?, ?, ?)");
        stmt.run(app_id, service_id, res.status, new Date().toISOString());
    } catch (e) {
        console.error(e);
        console.log(url, app_id, service_id);
        process.exit(1);
    }
}

async function startScrapJobs() {
    const configData = JSON.parse(readFileSync("./src/scrap_config.json", "utf8"));

    for (const conf of configData) {
        if (!registeredAppsServices.has(conf.app)) {
            registeredAppsServices.set(conf.app, new Set([conf.service]));
        } else {
            registeredAppsServices.get(conf.app).add(conf.service);
        }

        jobs[`${conf.app}:${conf.service}`] = new JobConfig(setInterval(() => {
            updateServiceStatus(conf.url, conf.app, conf.service);
        }, conf.interval * 1000));
    }
}

db.exec(`
    DROP TABLE IF EXISTS status;
    CREATE TABLE status (
        id INTEGER PRIMARY KEY,
        app TEXT NOT NULL,
        service TEXT NOT NULL,
        status_code INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_app_status ON status(app);
    CREATE INDEX idx_service_status ON status(service);
`);

fastify.get("/status", async (request, reply) => {
    return { message: "Alive" };
});

fastify.get("/v1/status/:app_id/:service_id", async (request, reply) => {
    const { app_id, service_id } = request.params;

    if (!registeredAppsServices[app_id] || !registeredAppsServices[app_id].has(service_id)) {
        reply.status(404);
        return { message: "App and service not found" };
    }

    reply.status(500);
    return { message: "Not yet implemented" };
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