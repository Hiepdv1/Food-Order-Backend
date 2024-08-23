import ErrorCustom from "../customs/Error.custom";
import HttpErrors from "http-errors";

export const CastErrorHandler = (error: ErrorCustom) => {
    const msg: string = `Invalid value for ${error.path}: ${error.value}`;

    return new HttpErrors.Unauthorized(msg);
};

export const SyntaxErrorHandler = (error: ErrorCustom) => {
    const msg = error.message;

    return new HttpErrors.BadRequest(msg);
};

export const ValidationErrorHandler = (error: ErrorCustom) => {
    const msg = error.message;

    return new HttpErrors.BadRequest(msg);
};

export const InvalidPhoneNumberHandler = (error: ErrorCustom) => {
    const msg = error.message;

    return new HttpErrors.BadRequest(msg);
};
