import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

export const validateToken = async (req, res, next) => {
  logger.info("Validating token");

  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      logger.warn("Access attempt without valid token");
      res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn("Invalid token, ", err);
        res.status(401).json({
          success: false,
          message: "Authentication failed",
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    logger.warn("Error while validating token..", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
