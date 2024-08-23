import HttpError from "http-errors";
import express from "express";

import VendorRoute from "./Vendor.route";
import AdminRoute from "./Admin.route";
import ShoppingRoute from "./Shopping.route";
import CustomerRoute from "./Customer.route";
import DeliveryRoute from "./Delivery.route";

const router = express.Router();

router.use("/vendor", VendorRoute);
router.use("/admin", AdminRoute);
router.use("/customer", CustomerRoute);
router.use("/shopping", ShoppingRoute);
router.use("/delivery", DeliveryRoute);

router.post("/xorsecret", (req, res, next) => {
    const token = req.body.csrfToken;
    const secret = process.env.CSRF_TOKEN_SECRET;
    if (secret && token) {
        const XorSecret = BigInt(token) ^ BigInt(secret);
        res.status(200).json({
            token: `0x${XorSecret.toString(16)}`,
        });
    } else {
        throw new HttpError.Unauthorized("Please provide Token");
    }
});

export default router;
