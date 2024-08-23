import express from "express";

import {
    CreateVendor,
    GetVendors,
    GetVendorByID,
    GetTransactions,
    GetTransactionById,
    VerifyDeliveryUser,
    GetDeliveryUsers,
    CreateManagerUser,
    ManagementUserLogin,
} from "../controllers";
import { SchemaBodyValidation } from "../validations";
import { VendorSchema } from "../schema";
import { VerifyDeliveryUserSchema } from "../schema/Delivery.schema";
import {
    CreateManagementUserSchema,
    ManagementUserLoginSchema,
} from "../schema/ManagementUser.schema";
import { Authenticate } from "../middlewares";

const router = express.Router();

router.post(
    "/login",
    SchemaBodyValidation(ManagementUserLoginSchema),
    ManagementUserLogin
);

router.use(Authenticate);
router.post(
    "/create",
    SchemaBodyValidation(CreateManagementUserSchema),
    CreateManagerUser
);

// router.post("/vandor", SchemaBodyValidation(VendorSchema), CreateVendor);

router.get("/vandors", GetVendors);
router.get("/vandors/:id", GetVendorByID);

router.get("/transactions", GetTransactions);
router.get("/transactions/:id", GetTransactionById);

router.get("/delivery/users", GetDeliveryUsers);
router.patch(
    "/delivery/verify",
    SchemaBodyValidation(VerifyDeliveryUserSchema),
    VerifyDeliveryUser
);

export default router;
