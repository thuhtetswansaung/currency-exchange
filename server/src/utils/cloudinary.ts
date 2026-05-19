import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/config';

cloudinary.config({
    cloud_name: config.CLOUDINARY_NAME,
    api_key: config.CLOUDINARY_KEY,
    api_secret: config.CLOUDINARY_SECRET,
});

export const upload = async (fileBuffer: Buffer): Promise<string | null> => {
    return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'upload' },
            (error, result) => {
                if (error || !result) {
                    console.log('Error uploading to Cloudinary', error);
                    resolve(null);
                } else {
                    console.log('Uploaded successfully to Cloudinary', result.url);
                    resolve(result.url);
                }
            }
        );
        uploadStream.end(fileBuffer);
    });
};