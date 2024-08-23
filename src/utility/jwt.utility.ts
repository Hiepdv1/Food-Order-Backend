import crypto from "node:crypto";
import jwt, { SignCallback } from "jsonwebtoken";

import { AuthPayload } from "../dto";
import HttpErrors from "http-errors";
import { redisClient } from "../db";
import ErrorCustom from "../customs/Error.custom";

export type RefreshTokenResponse = {
    encoded: string;
    exp: number;
};

const size: number = 32;
const timeRotation: number = 86400000;

let secretKey: string = crypto.randomBytes(size).toString("hex");

export const signAccessToken = (payload: AuthPayload): Promise<string> => {
    return new Promise((resolve, reject) => {
        const expiresEnv = process.env.ACCESS_TOKEN_EXPIRATION;
        const expiresIn = expiresEnv ? Number.parseInt(expiresEnv) : 1800;
        jwt.sign(
            payload,
            secretKey,
            { expiresIn },
            (error, encoded: string | undefined) => {
                if (encoded) {
                    resolve(encoded);
                } else if (error) {
                    reject(new HttpErrors.Unauthorized(error.message));
                }
                reject(
                    new HttpErrors.InternalServerError(
                        "Failed to generate accessToken"
                    )
                );
            }
        );
    });
};

export const signRefeshToken = (payload: {
    _id: string;
}): Promise<RefreshTokenResponse> => {
    return new Promise((resolve, reject) => {
        const secret = process.env.REFRESH_TOKEN_SECRET;
        const expiresEnv = process.env.REFRESH_TOKEN_EXPIRATION;
        const expiresIn = expiresEnv ? Number.parseInt(expiresEnv) : 864000;
        if (secret) {
            jwt.sign(
                payload,
                secret,
                { expiresIn },
                (error: Error | null, encoded: string | undefined) => {
                    if (encoded) {
                        resolve({
                            encoded,
                            exp: Math.ceil(Date.now() / 1000) + expiresIn, // second
                        });
                    } else if (error) {
                        reject(new HttpErrors.Unauthorized(error.message));
                    }
                    reject(
                        new HttpErrors.InternalServerError(
                            "Failed to generate RefreshToken"
                        )
                    );
                }
            );
        } else {
            reject(
                new HttpErrors.Forbidden(
                    "The refreshToken secret key is not available"
                )
            );
        }
    });
};

function convertToBigInt(hex: string) {
    try {
        const n = BigInt(hex);
        return n;
    } catch (err) {
        throw new HttpErrors.Forbidden(
            "Convert To BigInt failed: Input must be a hex string"
        );
    }
}

async function xorBitwise(key: string, tokenXor: string, secret: string) {
    const existingToken = await redisClient.get(key);
    if (!existingToken) throw new HttpErrors.Unauthorized("Unauthorized");
    const XorSecret = convertToBigInt(tokenXor) ^ convertToBigInt(secret);
    if (convertToBigInt(existingToken) !== XorSecret)
        throw new HttpErrors.Unauthorized("Unauthorized Token");

    return existingToken;
}

export const signCsrfToken = async (key: string, exp?: number) => {
    let expiresAt = 0;
    const time = exp && exp * 1000 - Date.now();
    if (time && time > 0) {
        expiresAt = time;
    } else {
        expiresAt = _getTTlCsrf();
    }
    const token = `0x${crypto.randomBytes(64).toString("hex")}`;
    await redisClient.set(
        key,
        convertToBigInt(token).toString(),
        "EX",
        expiresAt
    );
    return token;
};

export const verifyCsrfToken = async (key: string, tokenXor: string) => {
    const secret = process.env.CSRF_TOKEN_SECRET;
    if (secret) {
        return await xorBitwise(key, tokenXor, secret);
    } else {
        const error = new ErrorCustom(
            "The csrf secret is not available",
            403,
            "CsrfSecret"
        );
        error.isOperational = false;
        throw error;
    }
};

export const verifyAccessToken = (token: string) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretKey, {}, (error, decoded) => {
            if (error) {
                reject(new HttpErrors.Unauthorized(error.message));
            }
            resolve(decoded);
        });
    });
};

export const verifyRefreshToken = (token: string) => {
    return new Promise((resolve, reject) => {
        const secret = process.env.REFRESH_TOKEN_SECRET;
        if (secret) {
            jwt.verify(token, secret, {}, (error, decoded) => {
                if (error) {
                    reject(new HttpErrors.Unauthorized(error.message));
                }
                resolve(decoded);
            });
        } else {
            reject(new HttpErrors.Forbidden("The secret key is not available"));
        }
    });
};

export const rotationSecretKey = () => {
    setInterval(() => {
        secretKey = crypto.randomBytes(size).toString("hex");
    }, timeRotation);
};

export function _getTTlCsrf(): number {
    const expiresAt = process.env.ACCESS_TOKEN_EXPIRATION;
    const exp = expiresAt ? Number.parseInt(expiresAt) : 864000;
    return exp;
}
