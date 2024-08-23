import { Schema, model, Document } from "mongoose";

interface IDeliveryDoc extends Document {
    email: string;
    password: string;
    salt: string;
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
    verified: boolean;
    isAvailable: boolean;
    pincode: string;
    locations?: {
        type: string;
        coordinates: [number, number];
    };
    dailyOrder: {
        count: number;
        lastResetTime: Date;
    };
    createdAt?: string;
    updatedAt?: string;
}

type PartialDelivery = Partial<IDeliveryDoc>;
type PartialDeliveryArray = Array<PartialDelivery>;

const DeliverySchema = new Schema(
    {
        email: { type: String, required: true },
        password: { type: String, required: true },
        salt: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        verified: { type: Boolean, default: false },
        isAvailable: { type: Boolean, default: false },
        pincode: { type: String, required: true },
        locations: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        dailyOrder: {
            count: { type: Number, default: 0 },
            lastResetTime: { type: Number, default: Date.now() },
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

DeliverySchema.index({ locations: "2dsphere" });

const DeliveryModel = model<IDeliveryDoc>(
    "Delivery",
    DeliverySchema,
    "deliverys"
);

const cleanDoc = (doc: PartialDelivery) => {
    delete doc.__v;
    delete doc.password;
    delete doc.salt;
    delete doc.createdAt;
    delete doc.updatedAt;
};

const TransformDeliveryDoc = (
    docs: PartialDeliveryArray | PartialDelivery | null
): PartialDeliveryArray | PartialDelivery | null => {
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

export {
    IDeliveryDoc,
    PartialDeliveryArray,
    PartialDelivery,
    DeliveryModel,
    TransformDeliveryDoc,
};
