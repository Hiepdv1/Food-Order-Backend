import HttpError from "http-errors";
import {
    OfferModel,
    PartialOfferArray,
    TransformOfferDoc,
    TransformVendorDoc,
    VendorModel,
} from "../models";
import {
    EditVendorInputs,
    VendorLoginInputs,
    CreateFoodInput,
    VendorProcessOrder,
    CreateOfferInputs,
    LocationInputs,
} from "./../dto";
import { NextFunction, Request, Response } from "express";
import {
    signAccessToken,
    signCsrfToken,
    signRefeshToken,
    ValidatePassword,
} from "../utility";
import { CustomSession } from "../types";
import { FoodModel, TransformFoodDoc } from "../models/Food.model";
import {
    OrderModel,
    PartialOrder,
    TransformOrderDoc,
} from "../models/Order.model";
import { rollbacks, SetRollbackCsrfToken } from "../utility/Rollback.utility";

export const VendorLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const VendorLogin = <VendorLoginInputs>req.body;

    const existingVendor = await VendorModel.findOne({
        email: VendorLogin.email,
    }).lean();

    if (!existingVendor)
        throw new HttpError.Unauthorized("The email is not found");

    await ValidatePassword(VendorLogin.password, existingVendor.password);

    const _id = existingVendor._id.toString();

    const signature = signAccessToken({
        _id,
        email: existingVendor.email,
        foodTypes: existingVendor.foodTypes,
        name: existingVendor.name,
    });
    const signRefreshToken = signRefeshToken({ _id });

    const [accessToken, refreshToken] = await Promise.all([
        signature,
        signRefreshToken,
    ]);

    const session = req.session as CustomSession;
    session.refreshToken = refreshToken;

    const csrfToken = await signCsrfToken(
        accessToken,
        session.refreshToken.exp
    );

    res.status(200).json({
        token: accessToken,
        refreshToken: session.refreshToken.encoded,
        csrfToken,
    });
};

export const GetVendorProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    if (user && token) {
        const existingVendor = await VendorModel.findById(user._id).lean({
            transform: TransformVendorDoc,
        });
        if (!existingVendor)
            throw new HttpError.NotFound("The vendor is not found");

        const session = req.session as CustomSession;
        const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

        return res.json({
            existingVendor,
            csrfToken,
        });
    } else {
        throw new HttpError.NotFound("The user or token is not found");
    }
};

export const UpdateVendorProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;
    const VendorInput = <EditVendorInputs>req.body;

    if (user && token) {
        const existingVendor = await VendorModel.findById(user._id);
        if (!existingVendor)
            throw new HttpError.NotFound("The vendor is not found");

        existingVendor.name = VendorInput.name;
        existingVendor.phone = VendorInput.phone;
        existingVendor.address = VendorInput.address;
        existingVendor.foodTypes = VendorInput.foodTypes;

        const savedResult = await existingVendor.save();
        const session = req.session as CustomSession;
        const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

        return res.json({
            data: savedResult,
            csrfToken,
        });
    } else {
        throw new HttpError.NotFound("The user or token is not found");
    }
};

export const UpdateVendorService = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    const { _csrf, ...locations } = <LocationInputs>req.body;

    if (user && token) {
        const updateVendor = VendorModel.findByIdAndUpdate(user._id, [
            {
                $set: {
                    locations,
                    serviceAvailable: {
                        $cond: {
                            if: "$serviceAvailable",
                            then: false,
                            else: true,
                        },
                    },
                },
            },
        ]);

        const session = req.session as CustomSession;
        SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

        const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

        const [vendor, csrfToken] = await Promise.all([
            updateVendor,
            newCsrfToken,
        ]);

        if (!vendor) throw new HttpError.NotFound("Vendor not found");

        return res.json({
            data: vendor,
            csrfToken,
        });
    } else {
        throw new HttpError.NotFound("The user or token is not found");
    }
};

export const addFood = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    const FoodInput = <CreateFoodInput>req.body;

    if (FoodInput.cloudinaryUrl?.length === 0)
        throw new HttpError.InternalServerError("Internal Server Error");

    if (user && token) {
        const existingVendor = await VendorModel.findById(user._id);
        if (!existingVendor)
            throw new HttpError.NotFound("The vendor is not found");

        const createdFood = await FoodModel.create({
            vendorId: existingVendor.id,
            name: FoodInput.name,
            description: FoodInput.description,
            category: FoodInput.category,
            foodType: FoodInput.foodType,
            images: FoodInput.cloudinaryUrl,
            readyTime: FoodInput.readyTime,
            price: FoodInput.price,
            rating: 0,
        });
        existingVendor.foods.push(createdFood);

        const result = await existingVendor.save();
        const session = req.session as CustomSession;
        SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

        const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

        return res.json({
            data: result,
            csrfToken,
        });
    } else {
        throw new HttpError.NotFound("The user or token is not found");
    }
};

export const getFoods = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    if (user && token) {
        const foods = await FoodModel.findOne({ vendorId: user._id }).lean({
            transform: TransformFoodDoc,
        });

        const session = req.session as CustomSession;
        const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

        return res.json({
            data: foods,
            csrfToken,
        });
    } else {
        throw new HttpError.NotFound("The user or token is not found");
    }
};

export const UpdateVendorCoverImage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;
    const cloudinaryUrl = req.body.cloudinaryUrl;

    if (cloudinaryUrl.length === 0)
        throw new HttpError.InternalServerError("Internal Server Error");

    if (user && token) {
        const existingVendor = await VendorModel.findById(user._id);
        if (!existingVendor)
            throw new HttpError.NotFound("The vendor is not found");

        existingVendor.coverImages = cloudinaryUrl;

        const savedResult = await existingVendor.save();
        const session = req.session as CustomSession;
        const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

        return res.json({
            data: savedResult,
            csrfToken,
        });
    } else {
        throw new HttpError.NotFound("The user or token is not found");
    }
};

export const GetCurrentOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide access token for this");

    const findOrder = OrderModel.findOne({ vendorId: user?._id })
        .lean()
        .populate({
            path: "items.food",
            options: { lean: true },
            transform: TransformFoodDoc,
        })
        .transform(TransformOrderDoc) as Promise<PartialOrder>;

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [order, csrfToken] = await Promise.all([findOrder, newCsrfToken]);

    if (!order) throw new HttpError.NotFound("Order Not Found");

    res.json({
        order,
        csrfToken,
    });
};

export const GetOrderDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const orderId = req.params.id;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide access token for this");

    const findOrder = OrderModel.findById(orderId)
        .lean()
        .populate({
            path: "items.food",
            options: { lean: true },
            transform: TransformFoodDoc,
        })
        .transform(TransformOrderDoc) as Promise<PartialOrder>;

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [order, csrfToken] = await Promise.all([findOrder, newCsrfToken]);

    if (!order) throw new HttpError.NotFound("Order not found");

    res.json({
        order,
        csrfToken,
    });
};

export const ProcessOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const orderId = req.params.id;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide access token for this");

    const { status, remarks, time } = <VendorProcessOrder>req.body;

    const findOrder = OrderModel.findByIdAndUpdate(
        orderId,
        {
            orderStatus: status,
            remarks,
            readyTime: time,
        },
        { new: true }
    )
        .lean()
        .populate({
            path: "items.food",
            options: { lean: true },
            transform: TransformFoodDoc,
        })
        .transform(TransformOrderDoc) as Promise<PartialOrder>;

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [order, csrfToken] = await Promise.all([findOrder, newCsrfToken]);

    if (!order) throw new HttpError.NotFound("Unable to process order");

    res.json({
        order,
        csrfToken,
    });
};

export const GetOffers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    if (!user) throw new HttpError.BadRequest("Vendor not found");
    if (!token)
        throw new HttpError.BadRequest("Please provide access token for this");

    const findOffers = OfferModel.find({
        $or: [
            {
                vendors: user?._id,
            },
            {
                offerType: "GENERIC",
            },
        ],
    })
        .lean()
        .populate({
            path: "vendors",
            options: { lean: true },
            transform: TransformVendorDoc,
        })
        .transform(TransformOfferDoc) as Promise<PartialOfferArray>;

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [offers, csrfToken] = await Promise.all([findOffers, newCsrfToken]);

    res.json({
        offers,
        csrfToken,
    });
};

export const AddOffer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    const offerInput = <CreateOfferInputs>req.body;

    if (!token)
        throw new HttpError.BadRequest("Please provide access token for this");

    const vendor = await VendorModel.findById(user?._id, { _id: 1 }).lean();

    if (!vendor) throw new HttpError.BadRequest("Vendor not found");

    const session = req.session as CustomSession;

    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const createOffer = OfferModel.create({
        ...offerInput,
        vendors: [vendor],
    });

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [offer, csrfToken] = await Promise.all([createOffer, newCsrfToken]);

    res.json({
        offer,
        csrfToken,
    });
};

export const EditOffer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const auth = req.user;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide access token for this");

    const offerId = req.params.id;

    const offerInputs = <CreateOfferInputs>req.body;

    const session = req.session as CustomSession;

    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

    if (!token) throw new HttpError.BadRequest("Vendor not found");

    const vendor = await VendorModel.exists({ _id: auth?._id });

    if (!vendor) throw new HttpError.BadRequest("Vendor not found");

    const offer = await OfferModel.findOneAndUpdate(
        { _id: offerId },
        offerInputs,
        { new: true }
    );

    if (!offer) throw new HttpError.BadRequest("offer not found");

    res.json({
        offer,
        csrfToken,
    });
};
