import express from "express";
import {
    GetAvailableOffers,
    GetFoodAvailability,
    GetFoodIn30Min,
    GetTopRestaurants,
    RestaurantByID,
    SearchFoods,
} from "../controllers";
import { SchemaBodyValidation } from "../validations";
import { OrderSchema } from "../schema";
import { OrderInputs } from "../dto/Customer.dto";
import mongoose from "mongoose";
import { CalculateNetAmout } from "../Queries/Customer.pipeline";
import { FoodModel } from "../models";

const router = express.Router();

// Food Availability
router.get("/:pincode", GetFoodAvailability);

// Top Restaurants
router.get("/top-restaurants/:pincode", GetTopRestaurants);

// Food Available in 30 minutes
router.get("/foods-in-30-min/:pincode", GetFoodIn30Min);

// Search Foods
router.get("/search/:pincode", SearchFoods);

// Find offer
router.get("/offers/:pincode", GetAvailableOffers);

// Find Restaurant By ID
router.get("/restaurants/:id", RestaurantByID);

router.post(
    "/test",
    SchemaBodyValidation(OrderSchema),
    async (req, res, next) => {
        const { txnId, amount, items } = <OrderInputs>req.body;
        const foodObjectIds = items.map((item, i) => {
            const objectId = new mongoose.Types.ObjectId(item._id);
            items[i].objectId = objectId;
            return objectId;
        });
        const pipeline = CalculateNetAmout(foodObjectIds, items);
        const calcNetAmount = await FoodModel.aggregate(pipeline);

        res.json(calcNetAmount);
    }
);

export default router;
