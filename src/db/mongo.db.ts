import mongoose from "mongoose";
import { logger } from "../logs";

const connectDb = () => {
    if (process.env.MONGO_URI) {
        mongoose
            .connect(process.env.MONGO_URI)
            .then(() => {
                logger.info("Connected to mongoose successfully");
            })
            .catch((err) => {
                logger.error("Error connecting to mongoose: ", err);
            });
    } else {
        logger.error("The MONGO_URI is not available");
    }
};

export { connectDb };
