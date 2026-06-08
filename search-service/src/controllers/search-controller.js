import Search from "../models/Search.js";
import { logger } from "../utils/logger.js";

export const searchPostController = async (req, res, next) => {
  logger.info("Search endpoint hit");
  try {
    const { query } = req.query;
    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    return res.json(results);
  } catch (error) {
    logger.error("Error while searching.", error);
    return res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};
