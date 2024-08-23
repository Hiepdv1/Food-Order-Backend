import mongoose, { Document, Schema, model } from "mongoose";

interface ITransactionDoc extends Document {
    customer: string;
    vendorId: Array<string>;
    orderId: string;
    orderValue: number;
    offerUsed: string;
    status: string;
    paymentMode: string;
    paymentReponse: string;
    createdAt?: Date;
    updatedAt?: Date;
}

type PartialTransaction = Partial<ITransactionDoc>;
type PartialTransactionArray = Array<PartialTransaction>;

const TransactionSchema = new Schema(
    {
        customer: { type: String, required: true },
        vendorId: { type: [String], required: true },
        orderId: { type: String, required: true },
        orderValue: { type: Number, required: true },
        offerUsed: { type: String, required: true },
        status: {
            type: String,
            required: true,
            enum: ["FAILED", "SUCCESS", "OPEN", "CONFIRMED"],
        },
        paymentMode: { type: String, required: true },
        paymentResponse: { type: String },
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                cleanDoc(ret);
            },
        },
    }
);

const cleanDoc = (doc: PartialTransaction) => {
    delete doc.__v;
};

const TransformTransactionDoc = (
    docs: PartialTransactionArray | PartialTransaction | null
) => {
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

const TransactionModel = model<ITransactionDoc>(
    "Transaction",
    TransactionSchema,
    "transactions"
);

export {
    ITransactionDoc,
    TransactionModel,
    PartialTransaction,
    PartialTransactionArray,
    TransformTransactionDoc,
};
