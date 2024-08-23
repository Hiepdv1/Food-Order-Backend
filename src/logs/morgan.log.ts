import { request, Request, Response } from "express";
import morgan from "morgan";

import { logger } from "./winston.log";

const stream = {
    write: (message: string) => logger.http(message),
};

const skip = (req: Request, res: Response) => {
    console.log("Res Error: ", res, req);
    const env = process.env.NODE_ENV || "development";
    return env === "production" ? res.statusCode < 400 : false;
};

export const morganLog = morgan(
    ":remote-addr :user-agent :referrer :method :url :status :res[content-length] - :response-time ms",
    { stream, skip }
);
