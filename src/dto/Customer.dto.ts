import mongoose, { Schema } from "mongoose";

export interface CreateCustomerInput {
    email: string;
    phone: string;
    password: string;
}

export interface CustomerPayload {
    _id: string;
    email: string;
    verified: boolean;
}

export interface CustomerLoginInput {
    email: string;
    password: string;
}

export interface EditCustomerProfileInputs {
    firstName: string;
    lastName: string;
    address: string;
}

export interface CartItemInput {
    _id: string;
    unit: number;
    objectId?: mongoose.Types.ObjectId;
}

export interface OrderInputs {
    txnId: string;
    amount: number;
    items: Array<CartItemInput>;
    locations: {
        lat: number;
        lng: number;
    };
}

export interface CreatePaymentInputs {
    paymentMode: string;
    amount: number;
    offerId: string;
}
