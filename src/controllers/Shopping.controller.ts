import { ParialVendor } from "./../models/Vendor.model";
import HttpErrors from "http-errors";
import { Request, Response, NextFunction } from "express";
import {
    TransformVendorDoc,
    VendorModel,
    IFoodDoc,
    TransformFoodDoc,
    ParialVendorArray,
    OfferModel,
    TransformOfferDoc,
} from "../models";

const defaultLimit = 10;

export const GetFoodAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const pincode = req.params.pincode;

    const result = (await VendorModel.find({ pincode, serviceAvailable: true })
        .lean()
        .populate({
            path: "foods",
            options: { lean: true },
            transform: TransformFoodDoc,
        })
        .sort([["rating", "descending"]])
        .transform(TransformVendorDoc)) as ParialVendorArray;

    if (result && result.length <= 0)
        throw new HttpErrors.NotFound("Data is not found");

    res.json(result);
};

export const GetTopRestaurants = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const pincode = req.params.pincode;

    const result = await VendorModel.find({ pincode, serviceAvailable: true })
        .limit(10)
        .lean({ transform: TransformVendorDoc })
        .sort([["rating", "descending"]]);

    if (result.length <= 0) throw new HttpErrors.NotFound("Data is not found");

    res.json(result);
};

export const GetFoodIn30Min = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const pincode = req.params.pincode;

    const Vendors = (await VendorModel.find({ pincode, serviceAvailable: true })
        .limit(10)
        .lean()
        .populate({
            path: "foods",
            options: { lean: true },
            transform: TransformFoodDoc,
        })
        .transform(TransformVendorDoc)) as ParialVendorArray;

    if (Vendors.length <= 0) throw new HttpErrors.NotFound("Data is not found");

    const foodResult: Array<any> = [];

    Vendors.map((vendor) => {
        const foods = vendor.foods as [IFoodDoc];

        foodResult.push(...foods.filter((food) => food.readyTime <= 30));
    });

    res.json(Vendors);
};

export const SearchFoods = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const pincode = req.params.pincode;

    const Vendors = (await VendorModel.find({ pincode, serviceAvailable: true })
        .limit(10)
        .lean()
        .populate({
            path: "foods",
            options: { lean: true },
            transform: TransformFoodDoc,
        })
        .transform(TransformVendorDoc)) as ParialVendorArray;

    if (Vendors.length <= 0) throw new HttpErrors.NotFound("Data is not found");

    const foodResult: Array<any> = [];

    Vendors.map((items) => items.foods && foodResult.push(...items.foods));

    res.json(foodResult);
};

export const RestaurantByID = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const id = req.params.id;

    const result = (await VendorModel.findById(id)
        .lean()
        .populate({
            path: "foods",
            options: { lean: true },
            transform: TransformFoodDoc,
        })
        .transform(TransformVendorDoc)) as ParialVendor;

    if (!result) throw new HttpErrors.NotFound("Data Not Found");

    res.json(result);
};

export const GetAvailableOffers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const pincode = req.params.pincode;

    const offers = await OfferModel.find({ pincode }).lean({
        transform: TransformOfferDoc,
    });

    if (!offers) throw new HttpErrors.BadRequest("Offers not found");

    res.json(offers);
};
