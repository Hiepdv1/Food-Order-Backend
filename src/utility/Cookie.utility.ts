import { Response } from "express";

export const setCookie = (name: string, value: any, res: Response, expiresAt?: number) => {
    const expiresion = expiresAt || 1800000;
    const options: any = {
        expires: new Date(Date.now() + expiresion),
        secure: process.env.NODE_ENV === "production",
        httpOnly: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };

    res.cookie(name, JSON.stringify(value), options);
};
