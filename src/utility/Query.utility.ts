import { Model } from "mongoose";

type TransformFunction = (doc: Array<Partial<any>> | Partial<any>) => any;

interface IPopulateOptions {
    path: string;
    options?: { lean?: boolean; limit?: number; skip?: number };
    transform?: TransformFunction;
}

interface IOptions {
    page?: number;
    limit?: number;
    populate?: IPopulateOptions;
    transform?: TransformFunction;
}

export const paginate = async (
    model: Model<any>,
    query: any,
    options: IOptions
) => {
    const { page = 1, limit = 10, populate, transform } = options;
    const skip = (page - 1) * limit;
    const results = model.find(query).skip(skip).limit(limit).lean();
    if (populate) results.populate(populate);
    if (transform) results.transform(transform);
    return await results;
};
