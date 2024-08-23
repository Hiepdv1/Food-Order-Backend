import mongoose, { Document } from "mongoose";

export interface IVendorDoc extends Document {
    name: string;
    ownerName: string;
    foodTypes: Array<string>;
    pincode: string; // postal code
    address: string;
    phone: string;
    email: string;
    password: string;
    salt: string;
    serviceAvailable: boolean;
    coverImages: Array<{ _id: string; url: string }>;
    rating: number;
    foods: Array<any>;
    locations?: {
        type: string; // GeoJSON type
        coordinates: [number, number]; // [lng, lat]
    };
    createdAt?: string | number;
    updatedAt?: string | number;
}

export type ParialVendor = Partial<IVendorDoc>;
export type ParialVendorArray = Array<ParialVendor>;

const vendorSchemaDefinition = {
    name: {
        type: String,
        required: true,
    },
    ownerName: {
        type: String,
        required: true,
    },
    foodTypes: {
        type: Array<String>,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    salt: {
        type: String,
        required: true,
    },
    serviceAvailable: {
        type: Boolean,
        required: true,
        default: false,
    },
    coverImages: {
        type: [
            {
                _id: { type: String, required: true },
                url: { type: String, required: true },
            },
        ],
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    foods: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Food",
            default: [],
        },
    ],
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
} as const;

const VendorSchema = new mongoose.Schema(vendorSchemaDefinition, {
    timestamps: true,
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret.createdAt;
            delete ret.updatedAt;
            delete ret.password;
            delete ret.salt;
            return ret;
        },
    },
});

VendorSchema.index({ locations: "2dsphere" });

const VendorModel = mongoose.model<IVendorDoc>(
    "Vendor",
    VendorSchema,
    "vendors"
);

function removeFields(doc: ParialVendor) {
    delete doc.__v;
    delete doc.createdAt;
    delete doc.updatedAt;
    delete doc.password;
    delete doc.salt;
}

const TransformVendorDoc = (
    docs: ParialVendorArray | ParialVendor | null
): ParialVendorArray | ParialVendor | null => {
    if (Array.isArray(docs)) {
        docs.forEach((doc) => removeFields(doc));
        return docs;
    } else if (docs !== null) {
        removeFields(docs);
        return docs;
    } else {
        return null;
    }
};

export { VendorModel, TransformVendorDoc };
