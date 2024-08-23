import mongoose, { Document } from "mongoose";

export interface IFoodDoc extends Document {
    vendorId: string;
    name: string;
    description: string;
    category: string;
    foodType: string;
    readyTime: number;
    price: number;
    rating: number;
    images: Array<string>;
    createdAt?: string | number;
    updatedAt?: string | number;
}

export type ParialFood = Partial<IFoodDoc>;
export type ParialFoodArray = Array<ParialFood>;

const FoodSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        foodType: {
            type: String,
            required: true,
        },
        readyTime: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
        },
        images: {
            type: [
                {
                    _id: { type: String, required: true },
                    url: { type: String, required: true },
                },
            ],
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret: any) {
                cleanDoc(ret);
            },
        },
    }
);

const FoodModel = mongoose.model<IFoodDoc>("Food", FoodSchema, "foods");

function cleanDoc(doc: ParialFood) {
    delete doc.__v;
    delete doc.createdAt;
    delete doc.updatedAt;
}

const TransformFoodDoc = (docs: ParialFood | ParialFoodArray) => {
    if (Array.isArray(docs)) {
        docs.forEach((doc: ParialFood) => cleanDoc(doc));
        return docs;
    } else if (typeof docs === "object") {
        cleanDoc(docs);
        return docs;
    }
};

export { FoodModel, TransformFoodDoc };
