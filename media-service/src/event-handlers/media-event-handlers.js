import Media from "../models/Media.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";
import { logger } from "../utils/logger.js";

export const handlePostDeleted = async (event) => {
  try {
    const { postId, mediaIds } = event;

    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);

      logger.info(
        `Deleted media: ${media._id} associated with this deleted post: ${postId}`,
      );
    }

    logger.info(`Processed media deletion from post: ${postId}`);
  } catch (error) {
    logger.error("Error while deleting media id.", error);
    return res.status(500).json({
      success: false,
      message: "Error while deleting media id",
    });
  }
};
