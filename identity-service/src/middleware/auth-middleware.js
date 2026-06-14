import { logger } from "../utils/logger.js";
import jwt from "jsonwebtoken";

export const authenticateRequest = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      logger.warn(`Access attempted without user id`);
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please try again",
      });
    }

    req.user = { userId };
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const validateToken = async (req, res, next) => {
  try {
    const authorization = req.headers["authorization"];
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    logger.warn(`Error while validating token `, error);
    return res.status(401).json({
      success: false,
      message: "Token is expired",
    });
  }
};
