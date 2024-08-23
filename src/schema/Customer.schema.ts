import HttpErrors from "http-errors";
import Joi, { object } from "joi";
import { CartItemInput, OrderInputs } from "../dto/Customer.dto";
import mongoose, { Mongoose, Schema } from "mongoose";

const CustomerSchema = Joi.object({
    email: Joi.string().email().max(60).required(),
    password: Joi.string()
        .pattern(
            new RegExp(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,30}"
            )
        )
        .message(
            "The password must contain at least one lowercase letter, one uppercase letter, one digit, one special character and  minimum length 6 characters and maximum length 30 characters"
        ),
    phone: Joi.string().min(7).max(14).required(),
});

const OTPSchema = Joi.object({
    otp: Joi.number().required(),
    _csrf: Joi.string().required(),
});

const CustomerLoginSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
});

const EditCustomerProfileSchema = Joi.object({
    firstName: Joi.string().min(2).max(20).required(),
    lastName: Joi.string().min(2).max(20).required(),
    address: Joi.string().min(10).max(50).required(),
    _csrf: Joi.string().required(),
});

const EditCustomerPhoneSchema = Joi.object({
    phone: Joi.string().required(),
    _csrf: Joi.string().required(),
});

const mergeDuplicateItems = (
    values: Array<CartItemInput>,
    helpers: Joi.CustomHelpers<any>
) => {
    const results: Array<CartItemInput> = [];

    values.forEach((value) => {
        let index = -1;
        const isExist = results.find((result, i) => {
            if (result._id === value._id) {
                index = i;
                return result;
            }
        });
        if (isExist && index >= 0) {
            results[index].unit += value.unit;
        } else {
            results.push(value);
        }
    });

    return results;
};

const OrderSchema = Joi.object({
    txnId: Joi.string().required(),
    amount: Joi.number().required(),
    items: Joi.array()
        .items({
            _id: Joi.string().hex().length(24).required().messages({
                "string.length": "That is not a valid _id",
            }),
            unit: Joi.number().integer().min(1).required(),
        })
        .min(1)
        .required()
        .custom(mergeDuplicateItems, "MergeDuplicateItems"),
    locations: Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required(),
    }).required(),
    _csrf: Joi.string(),
});

const CartSchema = Joi.object({
    _id: Joi.string().required(),
    unit: Joi.number().integer().min(1).required(),
    _csrf: Joi.string(),
});

const CreatePaymentSchema = Joi.object({
    paymentMode: Joi.string().required(),
    amount: Joi.number().integer().required(),
    offerId: Joi.string().required(),
});

export {
    OTPSchema,
    CartSchema,
    OrderSchema,
    CustomerSchema,
    CreatePaymentSchema,
    CustomerLoginSchema,
    EditCustomerPhoneSchema,
    EditCustomerProfileSchema,
};
