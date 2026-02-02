import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export const uploadAvatarToCloudinary = (
  file: Express.Multer.File
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error('No file buffer'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'trello-assk/avatars',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new Error(error.message || 'Upload failed'));
        }
        if (!result) {
          return reject(new Error('Upload failed'));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
};

export const uploadBoardCoverToCloudinary = (
  file: Express.Multer.File
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error('No file buffer'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'trello-assk/board-covers',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new Error(error.message || 'Upload failed'));
        }
        if (!result) {
          return reject(new Error('Upload failed'));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
};

export const uploadAttachmentToCloudinary = (
  file: Express.Multer.File
): Promise<{ url: string; mimeType: string; bytes: number }> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error('No file buffer'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'trello-assk/attachments',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          return reject(new Error(error.message || 'Upload failed'));
        }
        if (!result) {
          return reject(new Error('Upload failed'));
        }
        resolve({
          url: result.secure_url,
          mimeType:
            file.mimetype || result.format || 'application/octet-stream',
          bytes: result.bytes,
        });
      }
    );
    uploadStream.end(file.buffer);
  });
};

export default cloudinary;
