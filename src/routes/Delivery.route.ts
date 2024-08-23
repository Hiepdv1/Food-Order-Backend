import express from "express";
import { Authenticate } from "../middlewares";
import {
    DeliveryUserLogin,
    DeliveryUserSignUp,
    EditProfileDelivery,
    GetProfileDelivery,
    UpdateDeliveryUserStatus,
} from "../controllers";
import { SchemaBodyValidation } from "../validations";
import {
    DeliveryLoginSchema,
    DeliverySchema,
    EditDeliveryUserProfile,
} from "../schema/Delivery.schema";
import { LocationsInputSchema } from "../schema";

const router = express.Router();

// Create / Signup Customer
router.post(
    "/login",
    SchemaBodyValidation(DeliveryLoginSchema),
    DeliveryUserLogin
);

router.post(
    "/signup",
    SchemaBodyValidation(DeliverySchema),
    DeliveryUserSignUp
);

// Authenticate
router.use(Authenticate);

// Change Service Status
router.patch(
    "/change-status",
    SchemaBodyValidation(LocationsInputSchema),
    UpdateDeliveryUserStatus
);

// Profile
router.get("/profile", GetProfileDelivery);

router.patch(
    "/profile",
    SchemaBodyValidation(EditDeliveryUserProfile),
    EditProfileDelivery
);

export default router;
