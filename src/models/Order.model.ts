import mongoose, { Document, Schema } from "mongoose";

interface IOrderDoc extends Document {
    orderId: string;
    vendorId: Array<string>;
    items: Array<any>;
    totalAmount: number;
    paidAmount: number;
    orderDate: Date;
    orderStatus: string; // To determine the current status: Watting, Failled, Accept, Reject, Under Process, Ready
    remarks: string;
    deliveryId: string;
    readyTime: number;
    locations: {
        lat: number;
        lng: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

type PartialOrder = Partial<IOrderDoc>;
type PartialOrderArray = Array<PartialOrder>;

const OrderSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true },
        vendorId: { type: [String], required: true },
        items: {
            type: [
                {
                    food: {
                        type: Schema.Types.ObjectId,
                        ref: "Food",
                    },
                    unit: { type: Number, required: true },
                },
            ],
        },
        totalAmount: { type: Number, required: true },
        paidAmount: { type: Number, required: true },
        orderDate: { type: Date, required: true },
        orderStatus: {
            type: String,
            required: true,
            enum: [
                "WAITING",
                "FAILLED",
                "ACCEPT",
                "REJECT",
                "PROCESS",
                "READY",
            ],
        },
        remarks: { type: String },
        deliveryId: { type: String },
        readyTime: { type: Number, required: true },
        locations: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
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

const OrderModel = mongoose.model<IOrderDoc>("Order", OrderSchema, "orders");

function cleanDoc(doc: PartialOrder) {
    delete doc.createdAt;
    delete doc.updatedAt;
    delete doc.__v;
}

function TransformOrderDoc(docs: PartialOrderArray | PartialOrder | null) {
    if (Array.isArray(docs)) {
        docs.forEach((doc) => cleanDoc(doc));
        return docs;
    } else if (docs !== null) {
        cleanDoc(docs);
        return docs;
    } else {
        return null;
    }
}

export {
    IOrderDoc,
    OrderModel,
    PartialOrder,
    PartialOrderArray,
    TransformOrderDoc,
};
