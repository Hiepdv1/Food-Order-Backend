import cron from "node-cron";
import { resetDailyOrderCount } from "./delivery.scheduler";

export const handleScheduler = () => {
    cron.schedule("0 0 * * *", async () => {
        await resetDailyOrderCount();
    });
};
