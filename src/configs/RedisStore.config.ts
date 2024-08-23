import { SessionData, Store } from "express-session";
import { Redis } from "ioredis";

interface RedisStoreOptions {
    client: Redis;
    prefix?: string;
    expires?: number;
}

const noop = (_err?: unknown, _data?: any) => {};

class RedisStore extends Store {
    public client: Redis;
    public prefix: string;
    public expires: number;

    constructor(opts: RedisStoreOptions) {
        super();
        this.client = opts.client;
        this.prefix = opts.prefix == null ? "sess:" : opts.prefix;
        this.expires = opts.expires || 0;
    }
    async get(sid: string, cb = noop) {
        const key = this.prefix + sid;
        try {
            const data = await this.client.get(key);
            if (data) return cb(null, JSON.parse(data));
            else return cb();
        } catch (err) {
            return cb(err);
        }
    }
    async set(sid: string, session: SessionData, cb = noop) {
        const key = this.prefix + sid;
        let ttl = this.getExpires(session);
        try {
            const val = JSON.stringify(session);
            if (ttl > 0) {
                await this.client.set(key, val, "EX", ttl);
                return cb();
            } else {
                return this.destroy(sid, cb);
            }
        } catch (err) {
            return cb(err);
        }
    }

    async destroy(sid: string, cb = noop) {
        const key = this.prefix + sid;
        try {
            await this.client.del([key]);
            return cb();
        } catch (err) {
            return cb(err);
        }
    }

    private getExpires(sess: SessionData) {
        let ttl = 3600;
        if (sess && sess.cookie && sess.cookie.expires) {
            let ms = Number(new Date(sess.cookie.expires)) - Date.now();
            ttl = Math.ceil(ms / 1000);
        }

        return ttl;
    }
}

export { RedisStore };
