import Media from "../models/Media.js";
import { uploadMediaToCloudinary } from "../utils/cloudinary.js";
import { logger } from "../utils/logger.js";

export const uploadMedia = async (req, res, next) => {
  logger.info("Starting media upload");

  try {
    if (!req.file) {
      logger.error("No file found. Please try adding a file");
      return res.status(400).json({
        success: false,
        message: "No file found. Please try adding a file",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File details: name:${originalname}, type: ${mimetype}`);

    logger.info("Upload to cloudinary starting");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);

    logger.info(
      `Cloudinary upload successfully. Public id: ${cloudinaryUploadResult.public_id} `,
    );

    console.log(originalname, mimetype);

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      data: {
        mediaId: newlyCreatedMedia._id,
        url: newlyCreatedMedia.url,
      },
      message: "Media upload is successfully",
    });
  } catch (error) {
    logger.error("Failed to upload file.", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllMedias = async (req, res, next) => {
  try {
    const results = await Media.find({});
    res.json(results);
  } catch (error) {
    logger.error("Error fetching medias.", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching medias",
    });
  }
};


async function upload() {
  const file =
    document.getElementById("fileInput")
      .files[0];

  const chunkSize =
    5 * 1024 * 1024; // 5 MB

  const totalChunks =
    Math.ceil(file.size / chunkSize);

  const fileId =
    crypto.randomUUID();

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(
      start + chunkSize,
      file.size
    );

    const chunk = file.slice(start, end);

    const formData = new FormData();

    formData.append("chunk", chunk);
    formData.append("fileId", fileId);
    formData.append("chunkNumber", i);

    await fetch(
      "http://localhost:3000/upload-chunk",
      {
        method: "POST",
        body: formData,
      }
    );

    console.log(
      `Uploaded chunk ${i + 1}/${totalChunks}`
    );
  }

  await fetch(
    "http://localhost:3000/merge",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        fileId,
        fileName: file.name,
        totalChunks,
      }),
    }
  );

  console.log("Upload completed");
}