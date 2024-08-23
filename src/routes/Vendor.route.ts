import express from "express";
import {
    VendorLogin,
    GetVendorProfile,
    UpdateVendorProfile,
    UpdateVendorService,
    addFood,
    getFoods,
    UpdateVendorCoverImage,
    GetCurrentOrder,
    GetOrderDetails,
    ProcessOrder,
    GetOffers,
    AddOffer,
    EditOffer,
    CreateVendor,
} from "../controllers";
import { Authenticate } from "../middlewares";
import { SchemaBodyValidation } from "../validations";
import {
    CreateOfferSchema,
    EditVendorSchema,
    FoodSchema,
    LocationsInputSchema,
    ProcessOrderSchema,
    VendorLoginSchema,
    VendorSchema,
} from "../schema";
import {
    uploadField,
    uploadImageToCloud,
} from "../middlewares/Upload.middleware";

const router = express.Router();

// Auth
router.post("/signup", SchemaBodyValidation(VendorSchema), CreateVendor);
router.post("/login", SchemaBodyValidation(VendorLoginSchema), VendorLogin);

router.use(Authenticate);
router.get("/profile", GetVendorProfile);
router.patch(
    "/profile",
    SchemaBodyValidation(EditVendorSchema),
    UpdateVendorProfile
);

// Food
router.patch(
    "/service",
    SchemaBodyValidation(LocationsInputSchema),
    UpdateVendorService
);
router.patch(
    "/coverimage",
    uploadField({ fieldName: "images", maxCount: 10 }),
    uploadImageToCloud,
    UpdateVendorCoverImage
);
router.post(
    "/food",
    SchemaBodyValidation(FoodSchema),
    uploadField({ fieldName: "images", maxCount: 10 }),
    uploadImageToCloud,
    addFood
);
router.get("/foods", getFoods);

// Orders
router.get("/orders", GetCurrentOrder);
router.get("/orders/:id", GetOrderDetails);
router.patch(
    "/orders/:id/process",
    SchemaBodyValidation(ProcessOrderSchema),
    ProcessOrder
);

// Offers
router.get("/offers", GetOffers);
router.post("/offer", SchemaBodyValidation(CreateOfferSchema), AddOffer);
router.put("/offers/:id", SchemaBodyValidation(CreateOfferSchema), EditOffer);

export default router;
