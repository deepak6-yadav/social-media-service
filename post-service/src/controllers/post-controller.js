import Post from "../models/Post.js";
import { logger } from "../utils/logger.js";
import { publishEvent } from "../utils/rabbitmq.js";
import { validatePost } from "../utils/validation.js";

async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

export const createPost = async (req, res, next) => {
  logger.info("Create post endpoint hit");
  try {
    const { error } = validatePost(req.body);

    if (error) {
      logger.warn("Error while validating post", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;
    const newPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();
    await invalidatePostCache(req, newPost._id.toString());

    logger.info("Post created successfully", newPost);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    logger.error("Failed to create refresh token.", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllPost = async (req, res, next) => {
  logger.info("Get all posts endpoint hit");
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;

    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json({
        data: JSON.parse(cachedPosts),
        message: "Cache hit",
      });
    }

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfPosts = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };

    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Failed to get posts.", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPost = async (req, res, next) => {
  logger.info("Create post endpoint hit");
  try {
    const postId = req.params.id;

    const cacheKey = `posts:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res.json({ success: true, data: JSON.parse(cachedPost) });
    }

    const post = await Post.findById(postId);

    if (!post) {
      logger.warn("Post not found");
      return res.status(400).json({
        success: false,
        message: "Post not found",
      });
    }

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(post));

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error("Failed to get post.", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deletePost = async (req, res, next) => {
  logger.info("Create post endpoint hit");
  try {
    const postId = req.params.id;
    const userId = req.user.userId;
    const post = await Post.findOneAndDelete({
      _id: postId,
      user: userId,
    });

    if (!post) {
      logger.warn("Post not found");
      return res.status(404).json({
        success: false,
        message: "No post found to be deleted",
      });
    }

    // Publish post delete method
    await publishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    await invalidatePostCache(req, req.params.id);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting post.", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
