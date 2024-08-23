import { ClientSession, Document, Schema, model } from "mongoose";
import { rollbacks } from "../utility/Rollback.utility";
import { IOrderDoc } from "./Order.model";
import { IFoodDoc } from "./Food.model";

interface ICustomerDoc extends Document {
    email: string;
    password: string;
    salt: string;
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
    verified: boolean;
    otp: number;
    otp_expiry: number;
    lat: number;
    lng: number;
    cart: Array<{ food: IFoodDoc; unit: number }>;
    orders: Array<IOrderDoc>;
    createdAt?: string;
    updatedAt?: string;
}

type ResponsePromise = () => Promise<void>;

type Transaction = {
    start: () => ReturnType<typeof startSession>;
    abort?: ResponsePromise | null;
    commit?: ResponsePromise | null;
};

export type PartialCustomer = Partial<ICustomerDoc>;
export type PartialCustomerArray = Array<Partial<PartialCustomer>>;

const CustomerSchema = new Schema(
    {
        email: { type: String, required: true },
        password: { type: String, required: true },
        salt: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        verified: { type: Boolean, required: true },
        otp: { type: Number, required: true },
        otp_expiry: { type: Number, required: true },
        lat: { type: Number },
        lng: { type: Number },
        cart: [
            {
                food: {
                    type: Schema.Types.ObjectId,
                    ref: "Food",
                    required: true,
                },
                unit: { type: Number, required: true },
            },
        ],
        orders: [
            {
                type: Schema.Types.ObjectId,
                ref: "Order",
                required: true,
            },
        ],
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

const CustomerModel = model<ICustomerDoc>(
    "Customer",
    CustomerSchema,
    "customers"
);

const cleanDoc = (doc: PartialCustomer) => {
    delete doc.password;
    delete doc.salt;
    delete doc.otp;
    delete doc.otp_expiry;
    delete doc.createdAt;
    delete doc.updatedAt;
    delete doc.__v;
};

const TransformCustomerDoc = (
    docs: PartialCustomerArray | PartialCustomer | null
): PartialCustomerArray | PartialCustomer | null => {
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

const refreshTransaction = () => {
    rollbackCustomer.start = startSession;
    rollbackCustomer.abort = null;
    rollbackCustomer.commit = null;
};

const abortSession = (session: ClientSession): ResponsePromise => {
    return async () => {
        await session.abortTransaction();
        session.endSession();
        refreshTransaction();
    };
};

const commitSession = (session: ClientSession): ResponsePromise => {
    return async () => {
        await session.commitTransaction();
        session.endSession();
        refreshTransaction();
    };
};

const startSession = async (): Promise<{
    abortSession: ResponsePromise;
    commitSession: ResponsePromise;
    session: ClientSession;
}> => {
    const session = await CustomerModel.startSession();
    session.startTransaction();
    rollbackCustomer.abort = abortSession(session);
    rollbackCustomer.commit = commitSession(session);

    rollbacks.set("transaction", rollbackCustomer.abort);

    return {
        abortSession: rollbackCustomer.abort,
        commitSession: rollbackCustomer.commit,
        session,
    };
};

const rollbackCustomer: Transaction = {
    start: startSession,
};

export { ICustomerDoc, CustomerModel, TransformCustomerDoc, rollbackCustomer };
