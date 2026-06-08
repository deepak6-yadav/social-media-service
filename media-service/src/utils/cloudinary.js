import { v2 as cloudinaryV2 } from "cloudinary";
import { logger } from "./logger.js";

cloudinaryV2.config({
  cloud_name: "dfiylgnl9",
  api_key: "597616955933559",
  api_secret: "mgRyl_MdAW7nrqQTYslSjb7OkKA",
});

export const uploadMediaToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          return reject(error);
        }

        resolve(result);
      },
    );
    uploadStream.end(file.buffer);
  });
};

export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinaryV2.uploader.destroy(publicId);
    logger.info("Media deleted successfully from cloud storage", publicId);
    return result;
  } catch (error) {
    logger.error("Error deleting media from cloudinary", error);
    throw error;
  }
};

export default cloudinaryV2;
