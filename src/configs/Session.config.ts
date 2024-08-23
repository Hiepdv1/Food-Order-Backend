import crypto from "node:crypto";
import session, { SessionOptions } from "express-session";
import { v4 as genuuid } from "uuid";
import { redisClient } from "../db";
import { RedisStore } from "./RedisStore.config";

const secretSession =
    process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const expiresIn = process.env.SESSION_EXPIRATION;

const redisStoreOptions = {
    client: redisClient,
    prefix: "Food-order",
};

const redisStore = new RedisStore(redisStoreOptions);

const sessionOptions: SessionOptions = {
    genid: function () {
        return genuuid();
    },
    secret: secretSession,
    resave: false,
    saveUninitialized: false,
    store: redisStore,
    cookie: {
        maxAge: expiresIn ? Number.parseInt(expiresIn) : 1800000,
        sameSite: "strict",
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.DOMAIN,
    },
};

export const sessionConfig = session(sessionOptions);
