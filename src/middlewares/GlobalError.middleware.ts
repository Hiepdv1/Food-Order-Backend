import { HttpError } from "http-errors";
import { NextFunction, Request, Response } from "express";
import ErrorCustom from "../customs/Error.custom";
import { logger, morganLog } from "../logs";
import {
    CastErrorHandler,
    SyntaxErrorHandler,
    ValidationErrorHandler,
    InvalidPhoneNumberHandler,
} from "../controllers";

type ErrorParameter = ErrorCustom;
type EnhancedError = ReturnType<typeof processError>;

const ErrorHandlerType: Record<
    string,
    (error: ErrorParameter) => HttpError | ErrorCustom
> = {
    SyntaxError: SyntaxErrorHandler,
    // mongoose
    CastError: CastErrorHandler,
    ValidationError: ValidationErrorHandler,
    // Invalid Phone Number
    "21211": InvalidPhoneNumberHandler,
};

export const isOperational = (error: Error): boolean => {
    const isErrorCustom = error instanceof ErrorCustom;
    const isHttpError = error instanceof HttpError;
    const { name } = error;
    return isErrorCustom || isHttpError || !!ErrorHandlerType[name];
};

const processError = (error: ErrorCustom): ErrorCustom | HttpError => {
    const { name, code } = error;

    const errorType = ErrorHandlerType[name] || ErrorHandlerType[`${code}`];

    console.log(
        "-------------------------Error Name-------------------------",
        name
    );

    if (errorType) {
        console.log(
            "--------------------------Error Handler Type------------------------",
            errorType(error).message
        );
        return errorType(error);
    }

    return error;
};

const devErrors = (error: EnhancedError, res: Response) => {
    const { message, status, stack, statusCode } = error;
    logger.info(message);
    res.status(statusCode).json({
        status,
        message,
        stackTrace: stack,
        error,
    });
};

const prodErrors = (error: EnhancedError, req: Request, res: Response) => {
    if (isOperational(error)) {
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
        });
    } else {
        logger.error(
            `Something went wrong with the path ${req.originalUrl} ${error.message}`
        );
        res.status(500).json({
            status: "Internal Server Error",
            message: "Something went wrong. Please try again later",
        });
    }
};

export const GlobalErrorHandler = (
    error: ErrorParameter,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!res.headersSent) {
        const errorCustom: EnhancedError = processError(error);
        error.statusCode = error.statusCode || 500;
        error.status = error.status || "Internal Server Error";

        if (process.env.NODE_ENV === "production") {
            prodErrors(errorCustom, req, res);
        } else {
            devErrors(errorCustom, res);
        }

        if (!isOperational(error)) morganLog(req, res, next);
    }
};
