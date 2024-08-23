import "../customs/ExpressLayerEnhancer.custom";

import { initRedis } from "../db";
import { logger } from "../logs";
import { connectDb } from "../db";

import { rotationSecretKey } from "../utility";
import { handleScheduler } from "../Schedulers";

const InitializeApp = () => {
    try {
        connectDb();
        initRedis();
        rotationSecretKey();
        handleScheduler();
    } catch (err) {
        logger.error(err);
    }
};

export default InitializeApp;
