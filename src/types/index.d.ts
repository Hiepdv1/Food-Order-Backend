import {
    CreateCustomerInput,
    CustomerPayload,
    CustomerLoginInput,
} from "./../dto/Customer.dto";
import session from "express-session";
import { AuthPayload } from "../dto/Auth.dto";
import { RefreshTokenResponse } from "../utility";

const Type_Validations = {
    CreateCustomerInput,
    CustomerPayload,
    CustomerLoginInput,
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
            headers: {
                authentication?: string;
            };
            token?: string;
            csrfToken?: string;
        }
    }
}

type CustomSessionData = session.SessionData & {
    refreshToken?: RefreshTokenResponse;
};

export type CustomSession = session.Session & Partial<CustomSessionData>;
