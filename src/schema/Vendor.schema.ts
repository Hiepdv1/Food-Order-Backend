import Joi from "joi";

export const VendorSchema = Joi.object({
    name: Joi.string().required(),
    ownerName: Joi.string().required(),
    foodType: Joi.array().items(Joi.string().required()).required(),
    pincode: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    coverImage: Joi.array().items(Joi.string().required()),
    locations: Joi.object({
        lat: Joi.number().required().default(0),
        lng: Joi.number().required().default(0),
    }),
});

export const VendorLoginSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
});

export const EditVendorSchema = Joi.object({
    phone: Joi.string().required(),
    address: Joi.string().required(),
    name: Joi.string().required(),
    foodTypes: Joi.array().items(Joi.string().required()).required(),
    csrfToken: Joi.string().required(),
});

export const FoodSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    foodType: Joi.string().required(),
    readyTime: Joi.number().required(),
    price: Joi.number().required(),
    _csrf: Joi.string(),
});

export const ProcessOrderSchema = Joi.object({
    status: Joi.string()
        .uppercase()
        .valid("WAITING", "FAILLED", "ACCEPT", "REJECT", "PROCESS", "READY")
        .required(),
    remarks: Joi.string().allow(""),
    time: Joi.number().integer().default(Date.now()),
    _csrf: Joi.string(),
});

export const CreateOfferSchema = Joi.object({
    offerType: Joi.string().valid("VENDOR", "GENERIC").uppercase().required(),
    title: Joi.string().required(),
    description: Joi.string().allow(""),
    offerAmount: Joi.number().required(),
    startValidity: Joi.date(),
    endValidity: Joi.date(),
    promoCode: Joi.string().required(),
    promoType: Joi.string()
        .valid("USER", "ALL", "BANK", "CARD", "VENDOR")
        .uppercase()
        .required(),
    bank: Joi.array().items(Joi.string().required()).default([]),
    bins: Joi.array().items(Joi.number().required()).default([]),
    pincode: Joi.string().required(),
    minValue: Joi.number().required(),
    isActive: Joi.boolean().required(),
    _csrf: Joi.string(),
});

export const LocationsInputSchema = Joi.object({
    _csrf: Joi.string(),
    lat: Joi.number().default(0),
    lng: Joi.number().default(0),
});
