import Fastify from "fastify";
import Database from "better-sqlite3";

const fastify = Fastify({
    logger: true
})

const db = new Database("./data/status.sqlite");

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

fastify.get("/", async (request, reply) => {
    return { message: "Alive" };
})

const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();