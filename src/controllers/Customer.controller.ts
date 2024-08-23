import { SetTransactionRollback } from "./../Rollbacks/Transaction.rollback";
import { v4 as gennui } from "uuid";

import HttpErrors from "http-errors";
import { NextFunction, Request, Response } from "express";
import {
    CartItemInput,
    CreateCustomerInput,
    CreatePaymentInputs,
    CustomerLoginInput,
    EditCustomerProfileInputs,
    OrderInputs,
} from "../dto/Customer.dto";
import {
    _getTTlCsrf,
    GenerateOtp,
    GeneratePassword,
    GenerateSalt,
    SendOTP,
    signAccessToken,
    signCsrfToken,
    signRefeshToken,
    ValidatePassword,
} from "../utility";
import {
    CustomerModel,
    FoodModel,
    OfferModel,
    PartialCustomer,
    rollbackCustomer,
    TransactionModel,
    TransformCustomerDoc,
    TransformFoodDoc,
    TransformOfferDoc,
} from "../models";
import { CustomSession } from "../types";
import { SetRollbackCsrfToken } from "../utility/Rollback.utility";
import {
    OrderModel,
    PartialOrder,
    TransformOrderDoc,
} from "../models/Order.model";
import { ValidateTransaction } from "../helpers/Transaction.helper";
import mongoose from "mongoose";
import { CalculateNetAmout } from "../Queries/Customer.pipeline";
import { NetAmountResult } from "../dto";
import { AssignOrderForDelivery } from "../helpers/Customer.helper";
import { SetCreatedOrderRollback } from "../Rollbacks/Customer.rollback";

// --------------------------------------- Customer Section --------------------------------
export const CustomerSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const CustomerInput = <CreateCustomerInput>req.body;

    const existingEmail = await CustomerModel.findOne({
        email: CustomerInput.email,
    }).lean();

    if (existingEmail)
        throw new HttpErrors[409](
            "An user exist with the provided email address already exist"
        );

    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(CustomerInput.password, salt);

    const { otp, exp } = GenerateOtp();

    const result = await CustomerModel.create({
        email: CustomerInput.email,
        password: userPassword,
        salt,
        firstName: "123",
        lastName: "123",
        phone: CustomerInput.phone,
        otp,
        otp_expiry: exp,
        address: "213",
        verified: false,
        lat: 0,
        lng: 0,
        orders: [],
    });

    if (!result) throw new HttpErrors.BadRequest("Error with signup");

    const token = await signAccessToken({
        _id: result.id,
        email: result.email,
        verified: false,
    });

    const csrfToken = await signCsrfToken(token);

    await SendOTP(otp, CustomerInput.phone);

    res.status(201).json({
        token,
        csrfToken,
        email: result.email,
        verified: result.verified,
    });
};

export const CustomerLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email, password } = <CustomerLoginInput>req.body;

    const customer = await CustomerModel.findOne({ email }).lean();
    if (!customer) throw new HttpErrors.NotFound("Customer not found");
    await ValidatePassword(password, customer.password);

    const customerId = customer._id.toString();

    const accessToken = signAccessToken({
        _id: customerId,
        email: customer.email,
        verified: customer.verified,
    });
    const rftk = signRefeshToken({ _id: customerId });

    const [token, refreshToken] = await Promise.all([accessToken, rftk]);

    const session = req.session as CustomSession;
    session.refreshToken = refreshToken;

    const csrfToken = await signCsrfToken(token, refreshToken.exp);

    res.json({
        token,
        refreshToken: refreshToken.encoded,
        csrfToken,
    });
};

export const CustomerVerify = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const transaction = await rollbackCustomer.start();

    const { otp } = req.body;
    const customer = req.user;

    if (!customer) throw new HttpErrors.BadRequest("Error with OTP validation");

    const profile = await CustomerModel.findById(customer._id);

    if (!profile) throw new HttpErrors.BadRequest("User not found");

    if (profile.otp !== otp || profile.otp_expiry <= Date.now()) {
        throw new HttpErrors.BadRequest("The OTP is not valid or expired");
    }

    profile.verified = true;

    const session = req.session as CustomSession;

    SetRollbackCsrfToken(req.token, req.csrfToken, session.refreshToken?.exp);

    const updatedCustomer = profile.save({ session: transaction.session });
    const signToken = signAccessToken({
        _id: profile.id,
        email: profile.email,
        verified: true,
    });

    const [updateCustomerResponse, token] = await Promise.all([
        updatedCustomer,
        signToken,
    ]);

    const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

    await transaction.commitSession();

    res.json({
        token,
        csrfToken,
        verified: updateCustomerResponse.verified,
        email: updateCustomerResponse.email,
    });
};

export const RequestOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const transaction = await rollbackCustomer.start();

    const Customer = req.user;
    const token = req.token;

    if (!Customer || !token)
        throw new HttpErrors.NotFound("The Customer or token is not found");

    const profile = await CustomerModel.findById(Customer._id);

    if (!profile) throw new HttpErrors.NotFound("The Customer is not found");

    const { otp, exp } = GenerateOtp();

    profile.otp = otp;
    profile.otp_expiry = exp;

    const session = req.session as CustomSession;

    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const updatedOtp = profile.save({ session: transaction.session });
    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [_, csrfToken] = await Promise.all([updatedOtp, newCsrfToken]);

    await SendOTP(otp, profile.phone);

    await transaction.commitSession();

    res.json({
        message: "OTP sent Successfully",
        csrfToken,
    });
};

export const GetCustomerProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const customer = req.user;
    const token = req.token;

    if (!customer || !token)
        throw new HttpErrors.NotFound(
            "The Customer or accessToken is not found"
        );

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const existingCustomer = CustomerModel.findById(customer._id).lean({
        transform: TransformCustomerDoc,
    });
    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [profile, csrfToken] = await Promise.all([
        existingCustomer,
        newCsrfToken,
    ]);

    if (!profile) throw new HttpErrors.NotFound("The Customer is not found");

    res.json({
        profile,
        csrfToken,
    });
};

export const EditCustomerProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const transaction = await rollbackCustomer.start();

    const customer = req.user;
    const token = req.token;
    const { firstName, lastName, address } = <EditCustomerProfileInputs>(
        req.body
    );

    if (!customer || !token)
        throw new HttpErrors.NotFound(
            "The Customer or accessToken is not found"
        );
    const profile = await CustomerModel.findById(customer._id).session(
        transaction.session
    );
    if (!profile) throw new HttpErrors.NotFound("The Customer is not found");

    profile.firstName = firstName;
    profile.lastName = lastName;
    profile.address = address;

    const session = req.session as CustomSession;

    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);
    const editedProfile = profile.save({ session: transaction.session });

    const [csrfToken, resultProfile] = await Promise.all([
        newCsrfToken,
        editedProfile,
    ]);

    await transaction.commitSession();

    res.json({
        profile: resultProfile,
        csrfToken,
    });
};

export const UpdatePhoneNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const transaction = await rollbackCustomer.start();

    const customer = req.user;
    const { phone } = req.body;
    if (!phone) throw new HttpErrors.NotFound("Phone Number is not found");
    if (!customer) throw new HttpErrors.NotFound("The Customer is not found");

    const profile = await CustomerModel.findById(customer._id);
    if (!profile) throw new HttpErrors.NotFound("The Customer is not found");

    const { otp, exp } = GenerateOtp();

    profile.phone = phone;
    profile.otp = otp;
    profile.otp_expiry = exp;
    profile.verified = false;

    const session = req.session as CustomSession;

    SetRollbackCsrfToken(req.token, req.csrfToken, session.refreshToken?.exp);

    const signToken = signAccessToken({
        _id: profile.id,
        email: profile.email,
        verified: false,
    });

    const editedProfile = profile.save({ session: transaction.session });

    const [token] = await Promise.all([signToken, editedProfile]);

    const csrfToken = await signCsrfToken(token, session.refreshToken?.exp);

    await SendOTP(otp, phone);

    await transaction.commitSession();

    res.json({
        token,
        verified: false,
        csrfToken,
    });
};

// ------------------------------------- Order Section ------------------------------------------
// export const CreateOrder = async (
//     req: Request,
//     res: Response,
//     next: NextFunction
// ) => {
//     const token = req.token;

//     if (!token) throw new HttpErrors.NotFound("Access Token is not found");

//     // grab current login customer
//     const customer = req.user;

//     const findProfile = CustomerModel.findById(customer?._id, {
//         id: 1,
//         cart: 1,
//         orders: 1,
//     });

//     const { txnId, amount, items } = <OrderInputs>req.body;

//     const validateTransaction = ValidateTransaction(txnId, {
//         vendorId: 1,
//         orderId: 1,
//         status: 1,
//     });

//     const foodIds = items.map((item) => item._id);

//     const findFoods = FoodModel.find(
//         { _id: { $in: foodIds } },
//         { _id: 1, price: 1, vendorId: 1 }
//     ).lean();

//     const [profile, foods, currentTransaction] = await Promise.all([
//         findProfile,
//         findFoods,
//         validateTransaction,
//     ]);

//     if (!profile) throw new HttpErrors.NotFound("Customer not found");

//     const foodIdSet = foods.map((f) => f._id.toString());
//     const missingFoodIds = foodIds.filter((id) => !foodIdSet.includes(id));

//     if (missingFoodIds.length > 0) {
//         throw new HttpErrors.BadRequest(
//             `The following foodIds are not found: ${missingFoodIds.join(", ")}`
//         );
//     }

//     // Calculate order amount and create cart items
//     let netAmount = 0.0;
//     const cartItems = items.map((item) => {
//         const food = foods.find((f) => f._id.toString() === item._id);
//         if (!food)
//             throw new HttpErrors.InternalServerError("Something went wrong");
//         netAmount += food.price * item.unit;
//         return {
//             food,
//             unit: item.unit,
//             vendorId: food.vendorId,
//         };
//     });

//     // create an order ID
//     const orderId = gennui();

//     const vendorIdList = [...new Set(cartItems.map((item) => item.vendorId))];

//     // Create Order with Item descriptions
//     const currentOrder = await OrderModel.create({
//         orderId: orderId,
//         vendorId: vendorIdList,
//         items: cartItems,
//         totalAmount: netAmount,
//         paidAmount: amount,
//         orderDate: new Date(),
//         orderStatus: "WAITING",
//         deliveryId: "1",
//         remarks: "",
//         readyTime: 45,
//     });

//     rollbacks.set("undoOrder", async () => {
//         const customerOrder = CustomerModel.updateOne(
//             { _id: profile.id },
//             {
//                 $pull: {
//                     orders: currentOrder.id,
//                 },
//             }
//         );
//         const order = OrderModel.findByIdAndDelete(currentOrder.id);
//         await Promise.all([customerOrder, order]);
//     });

//     if (!currentOrder)
//         throw new HttpErrors.BadRequest("Error with Create Order");

//     const session = req.session as CustomSession;
//     SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

//     // Finally Update Orders to user Account
//     profile.cart = [];
//     profile.orders.push(currentOrder);
//     const profileSave = profile.save();

//     currentTransaction.vendorId = vendorIdList;
//     currentTransaction.orderId = orderId;
//     currentTransaction.status = "CONFIRMED";

//     const saveTransaction = currentTransaction.save();

//     const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

//     const [_, csrfToken] = await Promise.all([
//         profileSave,
//         newCsrfToken,
//         saveTransaction,
//     ]);

//     res.json({
//         order: currentOrder,
//         csrfToken,
//     });
// };

export const CreateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req.user;
    const token = req.token;

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access token for this");

    const { txnId, amount, items, locations } = <OrderInputs>req.body;
    const foodObjectIds = items.map((item, i) => {
        const objectId = new mongoose.Types.ObjectId(item._id);
        items[i].objectId = objectId;
        return objectId;
    });

    const pipeline = CalculateNetAmout(foodObjectIds, items);

    const findProfile = CustomerModel.findById(user?._id, {
        id: 1,
        cart: 1,
        orders: 1,
    });
    const calcNetAmount = FoodModel.aggregate(pipeline);
    const validateTransaction = ValidateTransaction(txnId, {
        vendorId: 1,
        orderId: 1,
        status: 1,
    });

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [profile, calcNetAmountResult, currentTransaction, csrfToken] =
        await Promise.all([
            findProfile,
            calcNetAmount,
            validateTransaction,
            newCsrfToken,
        ]);

    if (!profile) throw new HttpErrors.BadRequest("Customer not found");

    const orderId = gennui();
    const calcResult = calcNetAmountResult[0] as NetAmountResult;

    if (!calcResult)
        throw new HttpErrors.BadRequest("The FoodIds is not found");

    const cartItems = calcResult.cartItems;
    if (!cartItems || cartItems.length !== items.length) {
        const existingIds = cartItems.map((item) => item._id.toString());
        const missingFoodIds = foodObjectIds.filter(
            (foodId) => !existingIds.includes(foodId.toString())
        );
        throw new HttpErrors.BadRequest(
            `The following food IDs are not found ${missingFoodIds.join(", ")}`
        );
    }

    // bulkWrite
    const currentOrder = await OrderModel.create({
        orderId: orderId,
        vendorId: calcResult.vendorIds,
        items: cartItems,
        totalAmount: calcResult.netAmount,
        paidAmount: amount,
        orderDate: new Date(),
        orderStatus: "WAITING",
        deliveryId: "",
        remarks: "",
        readyTime: 45,
        locations,
    });

    SetCreatedOrderRollback(currentOrder.id, profile.id);

    profile.cart = [];
    profile.orders.push(currentOrder);
    const saveProfile = profile.save();

    SetTransactionRollback(currentTransaction.id, {
        vendorId: currentTransaction.vendorId,
        orderId: currentTransaction.orderId,
        status: currentTransaction.status,
    });

    currentTransaction.vendorId = calcResult.vendorIds;
    currentTransaction.orderId = orderId;
    currentTransaction.status = "CONFIRMED";

    const saveTransaction = currentTransaction.save();

    const assignOrderForDelivery = AssignOrderForDelivery(
        currentOrder.id,
        calcResult.pincodes,
        calcResult.vendorAddress,
        locations
    );

    const [_, __, orderResult] = await Promise.all([
        saveProfile,
        saveTransaction,
        assignOrderForDelivery,
    ]);

    res.json({
        orders: orderResult,
        csrfToken,
    });
};

export const GetOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const customer = req.user;
    const token = req.token;

    if (!token) throw new HttpErrors.NotFound("The accessToken is not found");

    const findCustomer = CustomerModel.findById(customer?._id)
        .lean()
        .populate({
            path: "orders",
            options: { lean: true },
            transform: TransformOrderDoc,
        })
        .transform(TransformCustomerDoc) as Promise<PartialCustomer>;

    const session = req.session as CustomSession;

    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [profile, csrfToken] = await Promise.all([
        findCustomer,
        newCsrfToken,
    ]);

    if (!profile) throw new HttpErrors.NotFound("The Customer is not found");

    res.json({
        orders: profile.orders,
        csrfToken,
    });
};

export const GetOrderById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.token;

    const { id } = req.params;

    if (!id) throw new HttpErrors.BadRequest("Please provide a ID for this");

    if (!token) throw new HttpErrors.NotFound("The accessToken is not found");

    const findOrder = OrderModel.findById(id)
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

    const [profile, csrfToken] = await Promise.all([findOrder, newCsrfToken]);

    if (!profile) throw new HttpErrors.NotFound("The customer is not found.");

    res.json({
        profile,
        csrfToken,
    });
};

// ------------------------------------- Cart Section --------------------------------------

export const AddToCart = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const customer = req.user;
    const token = req.token;

    const cartInput = <CartItemInput>req.body;

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access token for this");

    const findCustomer = CustomerModel.findById(customer?._id).populate({
        path: "cart.food",
        transform: TransformFoodDoc,
    });

    const findFood = FoodModel.findById(cartInput._id).lean({
        transform: TransformFoodDoc,
    });

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [profile, food, csrfToken] = await Promise.all([
        findCustomer,
        findFood,
        newCsrfToken,
    ]);

    if (!profile) throw new HttpErrors.NotFound("The customer id is not found");
    if (!food) throw new HttpErrors.NotFound("The food id is not found");

    let index = -1;
    const existingFoodItem = profile.cart.find((item, i) => {
        if (item.food.id === cartInput._id) {
            index = i;
            return item;
        }
    });

    if (index >= 0 && existingFoodItem) {
        profile.cart[index].unit += cartInput.unit;
    } else {
        profile.cart.push({ food, unit: cartInput.unit });
    }

    const cartResult = await profile.save();

    res.json({
        carts: cartResult.cart,
        csrfToken,
    });
};

export const GetCart = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const customer = req.user;
    const token = req.token;

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access token for this");

    const findCustomer = CustomerModel.findById(customer?._id)
        .lean()
        .populate({
            path: "cart.food",
            options: { lean: true },
            transform: TransformFoodDoc,
        })
        .transform(TransformCustomerDoc) as Promise<PartialCustomer>;

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [profile, csrfToken] = await Promise.all([
        findCustomer,
        newCsrfToken,
    ]);

    if (!profile)
        throw new HttpErrors.NotFound("The customer _id is not found");

    res.json({
        carts: profile.cart,
        csrfToken,
    });
};

export const DeleteCart = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const customer = req.user;
    const token = req.token;

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access token for this");

    const updateCustomer = CustomerModel.updateOne(
        { _id: customer?._id },
        {
            $set: {
                cart: [],
            },
        }
    );

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [_, csrfToken] = await Promise.all([updateCustomer, newCsrfToken]);

    res.json({
        message: "Deleted cart successfully",
        csrfToken,
    });
};

export const DeleteCartById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const customer = req.user;
    const token = req.token;

    const id = req.body._id;

    if (!id) throw new HttpErrors.BadRequest("Please provide a valid id");

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access Token for this");

    const updateCustomer = CustomerModel.findOneAndUpdate(
        { _id: customer?._id, cart: { $elemMatch: { _id: id } } },
        {
            $pull: {
                cart: { _id: id },
            },
        },
        { new: true }
    )
        .lean()
        .populate({
            path: "cart",
            populate: {
                path: "food",
                options: { lean: true },
                transform: TransformFoodDoc,
            },
        });

    const session = req.session as CustomSession;
    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);

    const [profile, csrfToken] = await Promise.all([
        updateCustomer,
        newCsrfToken,
    ]);

    if (!profile)
        throw new HttpErrors.BadRequest(
            "Deleted failed or Not record is not valid"
        );

    res.json({
        carts: profile.cart,
        csrfToken,
    });
};

export const VerifyOffer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const offerId = req.params.id;
    const user = req.user;
    const token = req.token;

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access token for this");

    const session = req.session as CustomSession;

    SetRollbackCsrfToken(token, req.csrfToken, session.refreshToken?.exp);

    const newCsrfToken = signCsrfToken(token, session.refreshToken?.exp);
    const findOffer = OfferModel.findById(offerId).lean({
        transform: TransformOfferDoc,
    });
    const findCustomer = CustomerModel.findById(user?._id, { _id: 1 }).lean();

    const [csrfToken, offer, customer] = await Promise.all([
        newCsrfToken,
        findOffer,
        findCustomer,
    ]);

    if (!offer) throw new HttpErrors.BadRequest("Offer not found");
    if (!customer) throw new HttpErrors.BadRequest("Customer not found");

    if (offer.promoType === "USER") {
        // only can apply once per user
    } else {
        if (!offer.isActive) throw new HttpErrors.BadRequest();

        res.json({
            messgae: "offer is valid",
            offer,
            csrfToken,
        });
    }
};

export const CreatePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.token;
    const user = req.user;

    if (!user) throw new HttpErrors.BadRequest("Customer not found");

    const paymentInputs = <CreatePaymentInputs>req.body;

    if (!token)
        throw new HttpErrors.BadRequest("Please provide access token for this");

    const findCustomer = CustomerModel.exists({ _id: user?._id });
    const findOffer = OfferModel.findById(paymentInputs.offerId, {
        offerAmount: 1,
        isActive: 1,
    });

    const [customer, offer] = await Promise.all([findCustomer, findOffer]);

    if (!customer) throw new HttpErrors.BadRequest("Customer not found");
    if (!offer) throw new HttpErrors.BadRequest("Offer not found");

    if (!offer.isActive) throw new HttpErrors.BadRequest("offer is not active");

    const paymentAmount = paymentInputs.amount - offer.offerAmount;

    // Perform Payment Gateway charge API Call

    // right after payment gateway success // failure response

    // Create record on transaction
    const transaction = await TransactionModel.create({
        customer: user._id,
        vendorId: "1",
        orderId: "1",
        orderValue: paymentAmount,
        offerUsed: paymentInputs.offerId || "NA",
        status: "OPEN", // FAILED - SUCCESS
        paymentMode: paymentInputs.paymentMode,
        paymentReponse: "Payment is cash on delivery",
    });

    // Return Transaction ID

    res.json(transaction);
};
