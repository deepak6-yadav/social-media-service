import express from "express";
import multer, { memoryStorage } from "multer";

import { getAllMedias, uploadMedia } from "../controllers/media-controller.js";
import { authenticateRequest } from "../middleware/auth-middleware.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// configure multer
const upload = multer({
  storage: memoryStorage(),
  limits: {
    fieldSize: 5 * 1014 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error(`Multer while uploading:`, err);
        res.status(400).json({
          message: "Multer error while uploading:",
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error("Unknown error occurred while uploading", err);
        res.status(500).json({
          message: "Unknown error occurred while uploading",
          error: err.message,
          stack: err.stack,
        });
      }

      if (!req.file) {
        res.status(400).json({
          message: "No file found",
        });
      }

      next();
    });
  },
  uploadMedia,
);

router.get("/all-medias", authenticateRequest, getAllMedias);

export default router;
