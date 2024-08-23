import Redis, { RedisOptions } from "ioredis";
import { logger } from "../logs";

const configRedis: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
        ? Number.parseInt(process.env.REDIS_PORT)
        : 6048,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: function (times) {
        const delay = Math.min(times * 100, 3000);
        logger.debug(`Reconnecting Attempt Number: ${delay}`);
        return delay;
    },
};

export const redisClient = new Redis(configRedis);

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
