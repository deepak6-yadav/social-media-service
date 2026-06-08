import { logger } from "../utils/logger.js";

export const errorHandler = async (err, req, res, next) => {
  logger.error(err.stack);

  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
};
