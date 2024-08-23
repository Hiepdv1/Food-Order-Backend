import { Request, Response, NextFunction } from "express";
import { ClearRollbacksHandler } from "../utility/Rollback.utility";

const handleResponseFinished = (status: number) => {
    ClearRollbacksHandler();
};

const handleResponseFinishedError = (status: number) => {};

export const ResponseHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.on("finish", () => {
        const statusCode = res.statusCode;
        if (statusCode && statusCode >= 200 && statusCode < 300) {
            handleResponseFinished(statusCode);
        } else if (statusCode) {
            handleResponseFinishedError(statusCode);
        }
    });

    next();
};
