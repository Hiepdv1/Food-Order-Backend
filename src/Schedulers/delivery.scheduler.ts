import { logger } from "../logs";
import { DeliveryModel } from "../models";

export const resetDailyOrderCount = async () => {
    try {
        await DeliveryModel.updateMany(
            {},
            { "dailyOrder.count": 0, "dailyOrder.lastResetTime": Date.now() }
        );
    } catch (error: any) {
        if (error instanceof Error) {
            logger.error(
                `Has error with reset daily order count: ${error.message}`
            );
        } else {
            `Has error with reset daily order count: ${error}`;
        }
    }
};
