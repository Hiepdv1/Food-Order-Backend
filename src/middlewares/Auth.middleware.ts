import * as JwtUtility from "./../utility/jwt.utility";
import HttpError from "http-errors";
import { NextFunction, Request, Response } from "express";
import { redisClient } from "../db";
import { AuthPayload } from "../dto/Auth.dto";

export const Authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    const csrfToken =
        (req.body && req.body._csrf) ||
        (req.headers && req.headers["x-xsrf-token"]) ||
        (req.query && req.query._csrf);
    const accesToken = authHeader && authHeader.split(" ")[1];

    if (!accesToken)
        throw new HttpError.Unauthorized("No Access token provided");
    if (!csrfToken) throw new HttpError.Unauthorized("No csrf Token provided");

    const isDenyList = await redisClient.get(`bl_${accesToken}`);
    if (isDenyList) throw new HttpError.Unauthorized("JWT Rejected");

    const verifyAccessToken = JwtUtility.verifyAccessToken(accesToken);
    const vefiryCsrfToken = JwtUtility.verifyCsrfToken(accesToken, csrfToken);

    const [token, result] = await Promise.all([
        verifyAccessToken,
        vefiryCsrfToken,
    ]);

    const user = token as AuthPayload;

    req.user = user;
    req.token = accesToken;
    req.csrfToken = result;

    next();
};
