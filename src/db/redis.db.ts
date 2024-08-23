import Redis, { RedisOptions } from "ioredis";
import { logger } from "../logs";

const portEnv = process.env.REDIS_PORT;

// const configRedis: RedisOptions = {
//     host: process.env.REDIS_HOSTNAME,
//     port: portEnv ? Number.parseInt(portEnv) : 6379,
//     // username: process.env.REDIS_USERNAME,
//     // password: process.env.REDIS_PASSWORD,
//     retryStrategy: function (count: number) {
//         logger.debug(`Reconnecting Attempt Number: ${count}`);
//         const delay = Math.min(count * 100, 3000);
//         return delay;
//     },
// };

export const redisClient = new Redis(
    process.env.REDIS_URI || "http://localhost"
);

const statusConnectRedis = {
    CONNECT: "connect",
    END: "end",
    RECONNECT: "reconnecting",
    ERROR: "error",
};

const handleEventConnection = () => {
    redisClient.on(statusConnectRedis.CONNECT, () => {
        logger.info(
            "connectionRedis - Connection status: connected successfully"
        );
    });
    redisClient.on(statusConnectRedis.END, () => {
        logger.info("connectionRedis - Connection status: disconnected");
    });
    redisClient.on(statusConnectRedis.RECONNECT, () => {
        logger.info(
            "connectionRedis - Connection status: Redis is reconnecting"
        );
    });
    redisClient.on(statusConnectRedis.ERROR, (err) => {
        logger.error(
            `Error connecting to Redis, Please try again later. ${err}`
        );
    });
};

export const initRedis = () => {
    handleEventConnection();
};
