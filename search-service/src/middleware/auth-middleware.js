import { logger } from "../utils/logger.js";

export const authenticateRequest = async (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    logger.warn(`Access attempted without user Id`);
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please login to continue",
    });
  }

  req.user = { userId };
  next();
};
