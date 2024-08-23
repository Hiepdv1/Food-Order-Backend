import mongoose from "mongoose";
import { IFoodDoc } from "../models";

export interface CreateFoodInput {
    name: string;
    description: string;
    category: string;
    foodType: string;
    readyTime: number;
    price: number;
    cloudinaryUrl?: Array<string>;
}

type ResponseCartItems = IFoodDoc & {
    _id: mongoose.Types.ObjectId;
    unit: number;
};

export interface ResponseVendorAddress {
    vendorId: mongoose.Types.ObjectId;
    locations: {
        lat: number;
        lng: number;
    };
    pincode: string;
}

export interface NetAmountResult {
    _id: null;
    netAmount: number;
    cartItems: Array<ResponseCartItems>;
    vendorIds: Array<string>;
    pincodes: Array<string>;
    vendorAddress: Array<ResponseVendorAddress>;
}
