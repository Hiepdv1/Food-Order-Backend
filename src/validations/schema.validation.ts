import HttpErrors from "http-errors";
import { NextFunction, Request, Response } from "express";
import { Schema } from "joi";

async function validation(schema: Schema, data: any) {
    try {
        return await schema.validateAsync(data);
    } catch (err: any) {
        if (err instanceof Error) {
            throw new HttpErrors.Unauthorized(err.message);
        }
        throw err;
    }
}

export const SchemaBodyValidation = (schema: Schema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const result = await validation(schema, req.body);
        req.body = result;
        next();
    };
};

export const SchemaParamValidation = (schema: Schema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const result = await validation(schema, req.params);
        req.params = result;
        next();
    };
};
