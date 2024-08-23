import { NextFunction, Request, Response } from "express";
import { CreateVendorInput } from "../dto";
import {
    VendorModel,
    DeliveryModel,
    TransactionModel,
    TransformDeliveryDoc,
    TransformTransactionDoc,
} from "../models";
import HttpError from "http-errors";
import {
    GeneratePassword,
    GenerateSalt,
    signAccessToken,
    signCsrfToken,
    signRefeshToken,
} from "../utility";
import {
    CreateManagementUserInput,
    ManagementUserLoginInput,
} from "../dto/Managementuser.dto";
import { ManagementUserModel } from "../models/ManagementUser.model";
import { CustomSession } from "../types";

export const CreateManagerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const managerUserInput = <CreateManagementUserInput>req.body;

    const salt = await GenerateSalt();

    const findManagementUser = ManagementUserModel.findOne(
        { email: managerUserInput.email },
        { _id: 1 }
    ).lean();

    const hashPassword = GeneratePassword(managerUserInput.password, salt);

    const [existingUser, password] = await Promise.all([
        findManagementUser,
        hashPassword,
    ]);

    if (existingUser)
        throw new HttpError.BadRequest(
            "The email address already exists. Please provide a other email address"
        );

    await ManagementUserModel.create({
        name: managerUserInput.name,
        email: managerUserInput.email,
        password,
        salt,
        role: managerUserInput.role,
        permissions: managerUserInput.permissions,
    });

    res.send("Created a new management user successfully");
};

export const ManagementUserLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const managementUserLoginInput = <ManagementUserLoginInput>req.body;

    const existingUser = await ManagementUserModel.findOne(
        {
            email: managementUserLoginInput.email,
        },
        { _id: 1 }
    ).lean();

    if (!existingUser)
        throw new HttpError.BadRequest("The user does not exist");

    const accessToken = signAccessToken({
        _id: existingUser._id.toString(),
        email: managementUserLoginInput.email,
    });
    const refreshToken = signRefeshToken({ _id: existingUser._id.toString() });

    const [token, refreshTokenEncoded] = await Promise.all([
        accessToken,
        refreshToken,
    ]);

    const session = req.session as CustomSession;
    session.refreshToken = refreshTokenEncoded;

    const csrfToken = await signCsrfToken(token, session.refreshToken.exp);

    res.json({
        token,
        refreshToken: refreshTokenEncoded.encoded,
        csrfToken,
    });
};

export const CreateVendor = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { locations, ...VandorInput } = <CreateVendorInput>req.body;

    const isAlreadyVendor = await VendorModel.findOne({
        email: VandorInput.email,
    });

    if (isAlreadyVendor) throw new HttpError.Conflict("Vendor already exists");

    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(VandorInput.password, salt);

    const createVendor = await VendorModel.create({
        ...VandorInput,
        password: userPassword,
        rating: 0,
        serviceAvailable: true,
        coverImages: [],
        salt,
        locations: {
            type: "Point",
            coordinates: [locations.lng, locations.lat],
        },
    });

    return res.status(200).json(createVendor);
};

export const GetVendors = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide a token for this");

    const IsAdmin = ManagementUserModel.findById(user?._id);
    const vendorList = VendorModel.find();

    const [admin, vendors] = await Promise.all([IsAdmin, vendorList]);

    if (!admin) throw new HttpError.BadRequest("Admin not found");
    if (admin.role !== "ADMIN") throw new HttpError.BadRequest("Unauthorized");

    const session = req.session as CustomSession;

    const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

    res.status(200).json({ vendors, csrfToken });
};

export const GetVendorByID = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const VendorId = req.params.id;
    const user = req.user;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide a token for this");

    const IsAdmin = ManagementUserModel.findById(user?._id);
    const existingVendor = VendorModel.findById(VendorId);

    const [admin, vendor] = await Promise.all([IsAdmin, existingVendor]);

    if (!admin) throw new HttpError.BadRequest("Admin not found");
    if (admin.role !== "ADMIN") throw new HttpError.BadRequest("Unauthorized");

    const session = req.session as CustomSession;

    const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

    res.status(200).json({ vendor, csrfToken });
};

export const GetTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide a token for this");

    const IsAdmin = ManagementUserModel.findById(user?._id);

    const findTransactions = TransactionModel.find().lean({
        transform: TransformTransactionDoc,
    });

    const [admin, transactions] = await Promise.all([
        IsAdmin,
        findTransactions,
    ]);

    if (!admin) throw new HttpError.BadRequest("Admin not found");
    if (admin.role !== "ADMIN") throw new HttpError.BadRequest("Unauthorized");

    const session = req.session as CustomSession;

    const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

    res.json({ transactions, csrfToken });
};

export const GetTransactionById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const transactionId = req.params.id;
    const user = req.user;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide a token for this");

    const IsAdmin = ManagementUserModel.findById(user?._id);

    const findTransaction = TransactionModel.findById(transactionId).lean({
        transform: TransformTransactionDoc,
    });

    const [admin, transaction] = await Promise.all([IsAdmin, findTransaction]);

    if (!transaction) throw new HttpError.NotFound("Transaction Id not found");

    if (!admin) throw new HttpError.BadRequest("Admin not found");
    if (admin.role !== "ADMIN") throw new HttpError.BadRequest("Unauthorized");

    const session = req.session as CustomSession;

    const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

    res.json({ transaction, csrfToken });
};

export const VerifyDeliveryUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { _id, status } = req.body;
    const user = req.user;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide a token for this");

    const IsAdmin = ManagementUserModel.findById(user?._id);
    const updateDelivery = DeliveryModel.findByIdAndUpdate(
        _id,
        {
            $set: {
                verified: status,
            },
        },
        { new: true }
    ).lean({ transform: TransformDeliveryDoc });

    const [admin, updatedResult] = await Promise.all([IsAdmin, updateDelivery]);

    if (!admin) throw new HttpError.BadRequest("Admin not found");
    if (admin.role !== "ADMIN") throw new HttpError.BadRequest("Unauthorized");

    const session = req.session as CustomSession;

    if (!updatedResult) throw new HttpError.BadRequest("Delivery not found");

    const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

    res.json({
        profile: updatedResult,
        csrfToken,
    });
};

export const GetDeliveryUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    if (!token)
        throw new HttpError.BadRequest("Please provide a token for this");

    const IsAdmin = ManagementUserModel.findById(user?._id);
    const findDeliveryUsers = DeliveryModel.find().lean({
        transform: TransformDeliveryDoc,
    });

    const [admin, deliveryUsers] = await Promise.all([
        IsAdmin,
        findDeliveryUsers,
    ]);

    if (!admin) throw new HttpError.BadRequest("Admin not found");
    if (admin.role !== "ADMIN") throw new HttpError.BadRequest("Unauthorized");

    const session = req.session as CustomSession;

    const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

    res.json({ deliveryUsers, csrfToken });
};
