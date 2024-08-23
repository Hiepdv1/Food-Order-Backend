import HttpErrors from "http-errors";
import { Request, Response, NextFunction } from "express";
import { ICloudinaryFile } from "../configs";
import { v4 as genuid } from "uuid";
import sharp from "sharp";
import {
    v2 as cloudinary,
    UploadApiErrorResponse,
    UploadApiResponse,
} from "cloudinary";

interface IField {
    fieldName: string;
    maxCount: number;
}

function UploadStream(
    file: ICloudinaryFile
): Promise<{ _id: string; url: string }> {
    return new Promise(async (resolve, reject) => {
        const resizedBuffer: Buffer = await sharp(file.buffer)
            .resize({ width: 1000, height: 800 })
            .toBuffer();

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "auto",
                folder: "Food-Order-images",
                public_id: genuid(),
            },
            (
                err: UploadApiErrorResponse | undefined,
                result: UploadApiResponse | undefined
            ) => {
                if (result) {
                    // When stored directly on the server, remove files after they are uploaded
                    // fs.unlink(file.path, (errFs) => {
                    //     if (errFs) reject(errFs);
                    // });
                    resolve({
                        _id: result.public_id,
                        url: result.secure_url,
                    });
                }
                reject(err);
            }
        );
        uploadStream.end(resizedBuffer);
    });
}

export const uploadField = (fields: Array<IField> | IField) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const files = req.files as ICloudinaryFile[];
        if (files.length === 0)
            throw new HttpErrors.BadRequest("No files provided");
        if (Array.isArray(fields)) {
            fields.forEach((field, index) => {
                const file = files.filter(
                    (file) => file.fieldname === field.fieldName
                );
                if (!file)
                    throw new HttpErrors.BadRequest(
                        `The ${field.fieldName} field is required or no files provided`
                    );
                if (file.length >= field.maxCount) {
                    throw new HttpErrors.BadRequest(
                        `The ${field.fieldName} field is to many files. Please select a number of files <= ${fields[index].maxCount}`
                    );
                }
            });
            next();
        } else {
            const file = files[0];
            const isExist = file.fieldname === fields.fieldName;
            if (!file || !isExist) {
                throw new HttpErrors.BadRequest(
                    `The ${fields.fieldName} field is required or no file provided`
                );
            }
            next();
        }
    };
};

export const uploadImageToCloud = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const files: ICloudinaryFile[] = req.files as ICloudinaryFile[];

    const filesPromises = files.map((file) => UploadStream(file));

    const result = await Promise.all(filesPromises);

    req.body.cloudinaryUrl = result;

    next();
};
