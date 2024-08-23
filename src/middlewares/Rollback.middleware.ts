import HttpErrors from "http-errors";
import { NextFunction, Request, Response } from "express";
import { HandleRollback, rollbacks } from "../utility/Rollback.utility";
import { logger } from "../logs";

export const handleRollbackData = async (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await HandleRollback();
        next(error);
    } catch (err) {
        if (err instanceof Error) {
            throw new HttpErrors.InternalServerError(
                `Rollback failed with Error: ${err.message}`
            );
        }
        throw err;
    }
};
