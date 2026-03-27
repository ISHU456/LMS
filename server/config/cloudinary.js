import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Define the folder and transformation based on file type
    const fileType = file.mimetype.split('/')[0];
    let folder = 'lms_uploads';
    let resource_type = 'auto';

    if (fileType === 'image') {
      folder = 'lms_images';
      resource_type = 'image';
    } else if (fileType === 'video') {
      folder = 'lms_videos';
      resource_type = 'video';
    } else {
      folder = 'lms_docs';
      resource_type = 'raw';
    }

    return {
      folder: folder,
      resource_type: resource_type,
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

export { cloudinary, storage };
