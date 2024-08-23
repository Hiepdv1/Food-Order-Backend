import mongoose, { Document, Schema, model } from "mongoose";

interface IOfferDoc extends Document {
    offerType: string; // Vendor - Generic
    vendors: Array<any>;
    title: string;
    description: string;
    offerAmount: number; // minimum order amount
    startValidity: Date;
    endValidity: Date;
    promoCode: string;
    promoType: string; // USER - ALL - BANK - CARD
    bank: Array<String>;
    bins: Array<Number>;
    pincode: string;
    minValue: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

type PartialOffer = Partial<IOfferDoc>;
type PartialOfferArray = Array<PartialOffer>;

const OfferSchema = new Schema(
    {
        offerType: {
            type: String,
            required: true,
            enum: ["VENDOR", "GENERIC"],
        },
        vendors: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Vendor",
                required: true,
            },
        ],
        title: { type: String, required: true },
        description: { type: String },
        minValue: { type: Number, required: true },
        offerAmount: { type: Number, required: true },
        startValidity: { type: Date },
        endValidity: { type: Date },
        promoCode: { type: String, required: true },
        promoType: {
            type: String,
            required: true,
            enum: ["USER", "ALL", "BANK", "CARD", "VENDOR"],
        },
        bank: {
            type: [
                {
                    type: String,
                },
            ],
        },
        bins: {
            type: [
                {
                    type: Number,
                },
            ],
        },
        pincode: { type: String, required: true },
        isActive: { type: Boolean },
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret: PartialOffer) {
                cleanDoc(ret);
            },
        },
    }
);

const cleanDoc = (doc: PartialOffer) => {
    delete doc.__v;
    delete doc.createdAt;
    delete doc.updatedAt;
};

const TransformOfferDoc = (
    docs: PartialOfferArray | PartialOffer | null
): PartialOfferArray | PartialOffer | null => {
    if (Array.isArray(docs)) {
        docs.forEach((doc) => cleanDoc(doc));
        return docs;
    } else if (docs !== null) {
        cleanDoc(docs);
        return docs;
    } else {
        return null;
    }
};

const OfferModel = model<IOfferDoc>("Offer", OfferSchema, "offers");

export {
    OfferModel,
    IOfferDoc,
    PartialOffer,
    PartialOfferArray,
    TransformOfferDoc,
};
