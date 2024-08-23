import Joi from "joi";

export const CreateManagementUserSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .pattern(
            new RegExp(
                "^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9])(?=.*[0-9]).{6,18}"
            )
        )
        .message(
            "The password must contain at least one uppercase character, one lowercase character, one special character, one digit, and have a minimum length of 6 characters and a maximum length of 16 characters."
        )
        .required(),
    role: Joi.string()
        .required()
        .uppercase()
        .valid("ADMIN", "MANAGER", "STAFF"),
    permissions: Joi.array()
        .items(Joi.string().uppercase().valid("ALL").required())
        .required(),
});

export const ManagementUserLoginSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
});
