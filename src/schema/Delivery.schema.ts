import Joi from "joi";

export const DeliverySchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
        .pattern(
            new RegExp(
                "^(?=.*[a-z])(?=.*[A-Z](?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,30})"
            )
        )
        .message(
            "Password must contain at least one lowercase letter, one uppercase letter, one digit, one special character and minimum length 6 characters and maximum length 30 characters"
        ),
    phone: Joi.string().min(7).max(14).required(),
    firstName: Joi.string().min(2).max(20).required(),
    lastName: Joi.string().min(2).max(20).required(),
    address: Joi.string().max(120).required(),
    pincode: Joi.string().required(),
    locations: Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required(),
    }).required(),
});

export const DeliveryLoginSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
    _csrf: Joi.string(),
});

export const EditDeliveryUserProfile = Joi.object({
    firstName: Joi.string().min(2).max(20),
    lastName: Joi.string().min(2).max(20),
    address: Joi.string().min(2).max(100),
    _csrf: Joi.string().max(128),
});

export const VerifyDeliveryUserSchema = Joi.object({
    _id: Joi.string().hex().length(24).required(),
    status: Joi.boolean().required(),
    _csrf: Joi.string(),
});
