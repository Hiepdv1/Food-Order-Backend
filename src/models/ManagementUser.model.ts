import mongoose, { Document, model } from "mongoose";

interface ManagementUser extends Document {
    name: string;
    email: string;
    password: string;
    salt: string;
    role: string;
    permissions: Array<string>;
    createdAt?: string;
    updatedAt?: string;
}

type PartialManagementUser = Partial<ManagementUser>;
type PartialManagementUserArray = Array<PartialManagementUser>;

const ManagementUserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        salt: { type: String, required: true },
        role: {
            type: String,
            required: true,
            enum: ["ADMIN", "MANAGER", "STAFF"],
        },
        permissions: { type: [String], required: true },
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

const ManagementUserModel = model(
    "ManagementUser",
    ManagementUserSchema,
    "ManagementUsers"
);

const cleanDoc = (doc: PartialManagementUser) => {
    delete doc.__v;
    delete doc.password;
    delete doc.salt;
    delete doc.createdAt;
    delete doc.updatedAt;
};

const TransformManagementUserDoc = (
    docs: PartialManagementUserArray | PartialManagementUser | null
): PartialManagementUserArray | PartialManagementUser | null => {
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
    ManagementUserModel,
    PartialManagementUser,
    PartialManagementUserArray,
    TransformManagementUserDoc,
};
