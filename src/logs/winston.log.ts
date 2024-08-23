import winston from "winston";
import "winston-daily-rotate-file";

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || "development";
    const isDevelopment = env === "development";
    return isDevelopment ? "debug" : "error";
};

const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => `${info.timestamp} ${info.level} ${info.message}`)
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.DailyRotateFile({
        filename: "appLogs/errors-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "30d",
        level: "error",
    }),
    new winston.transports.DailyRotateFile({
        filename: "appLogs/debug-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "30d",
        level: "debug",
    }),
    new winston.transports.DailyRotateFile({
        filename: "appLogs/info-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "30d",
        level: "info",
    }),
    new winston.transports.DailyRotateFile({
        filename: "appLogs/allLogs-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "30d",
    }),
];

export const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});
