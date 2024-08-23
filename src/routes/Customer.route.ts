import express from "express";
import {
    AddToCart,
    CreateOrder,
    CreatePayment,
    CustomerLogin,
    CustomerSignup,
    CustomerVerify,
    DeleteCart,
    DeleteCartById,
    EditCustomerProfile,
    GetCart,
    GetCustomerProfile,
    GetOrderById,
    GetOrders,
    RequestOtp,
    UpdatePhoneNumber,
    VerifyOffer,
} from "../controllers";
import { SchemaBodyValidation } from "../validations";
import {
    CartSchema,
    CreatePaymentSchema,
    CustomerLoginSchema,
    CustomerSchema,
    EditCustomerPhoneSchema,
    EditCustomerProfileSchema,
    OrderSchema,
    OTPSchema,
} from "../schema";
import { Authenticate } from "../middlewares";

const router = express.Router();

// Signup / Create Customer
router.post("/signup", SchemaBodyValidation(CustomerSchema), CustomerSignup);

// Login
router.post("/login", SchemaBodyValidation(CustomerLoginSchema), CustomerLogin);

// Authenticated
router.use(Authenticate);

// Verify Customer Account
router.patch("/verify", SchemaBodyValidation(OTPSchema), CustomerVerify);

// OTP / Requesting OTP
router.get("/otp", RequestOtp);

// Profile
router.get("/profile", GetCustomerProfile);
router.patch(
    "/profile",
    SchemaBodyValidation(EditCustomerProfileSchema),
    EditCustomerProfile
);
router.patch(
    "/phone",
    SchemaBodyValidation(EditCustomerPhoneSchema),
    UpdatePhoneNumber
);

// Cart
router.get("/cart", GetCart);
router.post("/cart", SchemaBodyValidation(CartSchema), AddToCart);
router.delete("/cart", DeleteCart);
router.delete("/cartId", DeleteCartById);

// Order
router.post("/create-order", SchemaBodyValidation(OrderSchema), CreateOrder);
router.get("/orders", GetOrders);
router.get("/orders/:id", GetOrderById);

// Apply Order
router.get("/offer/verify/:id", VerifyOffer);

// Payment
router.post(
    "/create-payment",
    SchemaBodyValidation(CreatePaymentSchema),
    CreatePayment
);

export default router;
