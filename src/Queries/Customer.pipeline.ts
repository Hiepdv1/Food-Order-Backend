import mongoose, { PipelineStage } from "mongoose";
import { CartItemInput } from "../dto/Customer.dto";

export const CalculateNetAmout = (
    foodObjectIds: Array<mongoose.Types.ObjectId>,
    items: Array<CartItemInput>
): Array<PipelineStage> => {
    return [
        {
            $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
            },
        },
        {
            $match: {
                _id: {
                    $in: foodObjectIds,
                },
            },
        },
        {
            $lookup: {
                from: "vendors",
                localField: "vendorId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: { pincode: 1, locations: 1, _id: 1 },
                    },
                    {
                        $addFields: {
                            geoLocation: {
                                lat: {
                                    $arrayElemAt: ["$locations.coordinates", 0],
                                },
                                lng: {
                                    $arrayElemAt: ["$locations.coordinates", 1],
                                },
                            },
                        },
                    },
                ],
                as: "vendorDetails",
            },
        },
        {
            $unwind: "$vendorDetails",
        },
        {
            $addFields: {
                unit: {
                    $let: {
                        vars: {
                            listItem: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: items,
                                            as: "item",
                                            cond: {
                                                $eq: [
                                                    "$$item.objectId",
                                                    "$_id",
                                                ],
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                        in: "$$listItem.unit",
                    },
                },
            },
        },
        {
            $group: {
                _id: null,
                netAmount: { $sum: { $multiply: ["$price", "$unit"] } },
                cartItems: {
                    $push: "$$ROOT",
                },
                pincodes: {
                    $addToSet: "$vendorDetails.pincode",
                },
                vendorIds: {
                    $addToSet: "$vendorDetails._id",
                },
                vendorAddress: {
                    $addToSet: {
                        vendorId: "$vendorDetails._id",
                        locations: "$vendorDetails.geoLocation",
                        pincode: "$vendorDetails.pincode",
                    },
                },
            },
        },
        {
            $unset: "cartItems.vendorDetails",
        },
    ];
};
