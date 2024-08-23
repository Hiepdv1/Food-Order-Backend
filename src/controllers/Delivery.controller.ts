import HttpErrors from "http-errors";
import { Request, Response, NextFunction } from "express";
import {
    CreateDeliveryUserInputs,
    DeliveryLoginInputs,
    EditDeliveryProfileInputs,
} from "../dto/Delivery.dto";
import {
    GeneratePassword,
    GenerateSalt,
    signAccessToken,
    signCsrfToken,
    signRefeshToken,
    ValidatePassword,
} from "../utility";
import { DeliveryModel, TransformDeliveryDoc } from "../models";
import { CustomSession } from "../types";
import { SetRollbackCsrfToken } from "../utility/Rollback.utility";
import { LocationInputs } from "../dto";
export const DeliveryUserSignUp = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const deliveryInputs = <CreateDeliveryUserInputs>req.body;

    const salt = await GenerateSalt();
    const generatePassowrd = GeneratePassword(deliveryInputs.password, salt);

    const existingDelivery = DeliveryModel.findOne(
        {
            email: deliveryInputs.email,
        },
        { _id: 1 }
    ).lean();

    const [delivery, password] = await Promise.all([
        existingDelivery,
        generatePassowrd,
    ]);

    if (delivery)
        throw new HttpErrors.BadRequest(
            "An delivery user has already. Please provide other email address"
        );

    const newDeliveryUser = await DeliveryModel.create({
        email: deliveryInputs.email,
        password,
        salt,
        phone: deliveryInputs.phone,
        address: deliveryInputs.address,
        firstName: deliveryInputs.firstName,
        lastName: deliveryInputs.lastName,
        pincode: deliveryInputs.pincode,
        locations: {
            type: "Point",
            coordinates: [
                deliveryInputs.locations.lng,
                deliveryInputs.locations.lat,
            ],
        },
    });

    const token = await signAccessToken({
        _id: newDeliveryUser.id,
        email: newDeliveryUser.email,
        verified: false,
    });

    const csrfToken = await signCsrfToken(token);

    res.json({
        token,
        csrfToken,
    });
};

export const DeliveryUserLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const deliveryInput = <DeliveryLoginInputs>req.body;

    const delivery = await DeliveryModel.findOne(
        {
            email: deliveryInput.email,
        },
        { password: 1, _id: 1, verified: 1, email: 1 }
    ).lean();

    if (!delivery) throw new HttpErrors.BadRequest("Delivery not found");
    await ValidatePassword(deliveryInput.password, delivery.password);

    const signToken = signAccessToken({
        _id: delivery._id.toString(),
        email: delivery.email,
        verified: delivery.verified,
    });
    const sighRefreshToken = signRefeshToken({ _id: delivery._id.toString() });

    const [token, refreshToken] = await Promise.all([
        signToken,
        sighRefreshToken,
    ]);
    const session = req.session as CustomSession;
    session.refreshToken = refreshToken;

    const csrfToken = await signCsrfToken(token, refreshToken.exp);

    res.json({
        email: delivery.email,
        verified: delivery.verified,
        token,
        csrfToken,
    });
};

export const GetProfileDelivery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const delivery = req.user;
    const token = req.token;

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access token for this");

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const findDelivery = DeliveryModel.findById(delivery?._id).lean({
        transform: TransformDeliveryDoc,
    });

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [existingDelivery, csrfToken] = await Promise.all([
        findDelivery,
        newCsrfToken,
    ]);

    if (!existingDelivery)
        throw new HttpErrors.BadRequest("Delivery user not found");

    res.json({
        profile: existingDelivery,
        csrfToken,
    });
};

export const EditProfileDelivery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const delivery = req.user;
    const token = req.token;

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access token for this");

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const deliveryInput = <EditDeliveryProfileInputs>req.body;

    const updateDelivery = DeliveryModel.findByIdAndUpdate(
        delivery?._id,
        {
            $set: {
                ...deliveryInput,
            },
        },
        { new: true }
    );
    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [updatedResult, csrfToken] = await Promise.all([
        updateDelivery,
        newCsrfToken,
    ]);

    if (!updateDelivery)
        throw new HttpErrors.BadRequest("Delivery user not found");

    res.json({
        profile: updatedResult,
        csrfToken,
    });
};

export const UpdateDeliveryUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const deliveryUser = req.user;
    const token = req.token;

    const { _csrf, ...locations } = <LocationInputs>req.body;

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access token for this");

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const updateDeliveryUser = DeliveryModel.findOneAndUpdate(
        { _id: deliveryUser?._id },
        [
            {
                $set: {
                    locations: {
                        type: "Point",
                        coordinates: [locations.lng, locations.lat],
                    },
                    isAvailable: {
                        $cond: { if: "$isAvailable", then: false, else: true },
                    },
                },
            },
        ],
        { new: true }
    ).lean({ transform: TransformDeliveryDoc });

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [updatedResult, csrfToken] = await Promise.all([
        updateDeliveryUser,
        newCsrfToken,
    ]);

    if (!updatedResult)
        throw new HttpErrors.BadRequest("Delivery user not found");

    res.json({
        profile: updatedResult,
        csrfToken,
    });
};
