import Search from "../models/Search.js";
import { logger } from "../utils/logger.js";

export const handlePostCreated = async (event) => {
  logger.info("Post created event triggered");
  try {
    const { postId, userId, content, createdAt } = event;

    const newSearchPost = new Search({
      postId,
      userId,
      content,
      createdAt,
    });

    await newSearchPost.save();

    logger.info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`,
    );
  } catch (error) {
    logger.error("Error while creating post in search.", error);
    return res.status(500).json({
      success: false,
      message: "Error while handling post create event",
    });
  }
};
