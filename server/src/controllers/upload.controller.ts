import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import UploadService from "../services/upload.service";

const uploadService = new UploadService()
export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
    try {
        console.log("FILE:", req.file);
        const fileBuffer = req.file?.buffer as Buffer
        const result = await uploadService.uploadPhoto(fileBuffer)
        res.status(200).json({
            success: true,
            message: "Upload successful",
            data: result,
        });
    } catch (error: any) {
        console.error("Upload error:", error);

        const statusCode = error.statusCode || 500;

        res.status(statusCode).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
}
)