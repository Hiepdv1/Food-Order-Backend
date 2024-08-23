import HttpErrors from "http-errors";
import { rollbackCustomer } from "../models";
import { _getTTlCsrf } from "./jwt.utility";
import { redisClient } from "../db";

type ResponseFuncValue = () => Promise<any>;

export const rollbacks = new Map<string, ResponseFuncValue>();

export const HandleRollback = async (): Promise<void> => {
    if (rollbacks.size > 0) {
        const promises = [];

        for (const [_, value] of rollbacks) {
            if (typeof value === "function") {
                promises.push(value());
            }
        }
        console.log("Promises: ", promises);
        await Promise.all(promises);

        rollbacks.clear();
    }
};

export const ClearRollbacksHandler = () => {
    if (rollbacks.size > 0) {
        rollbacks.clear();
        console.log("Clear rollbacks");
    }
};

export const SetRollbackCsrfToken = (
    token?: string,
    csrfToken?: string,
    exp?: number
) => {
    if (!token) throw new HttpErrors.NotFound("The accessToken is not found");
    if (!csrfToken) throw new HttpErrors.NotFound("The csrfToken is not found");
    exp = exp && exp * 1000 - Date.now() > 0 ? exp : _getTTlCsrf();

    rollbacks.set("RB_CSRFTOKEN", async () => {
        if (!csrfToken) throw new HttpErrors.NotFound("Csrf token not found");
        await redisClient.set(token, BigInt(csrfToken).toString(), "EX", exp);
    });
};
