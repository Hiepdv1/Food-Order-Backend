import { v2 as cloudinary } from "cloudinary";
import multer, { Multer } from "multer";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

export interface ICloudinaryFile extends Express.Multer.File {
    buffer: Buffer;
}

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads/");
//     },
//     filename: (req, file, cb) => {
//         cb(null, `${Date.now()}-${file.originalname}`);
//     },
// });

const storage = multer.memoryStorage();
export const upload: Multer = multer({ storage });
