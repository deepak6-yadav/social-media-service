import { config } from "dotenv";
config();
import express from "express";
import mongoose from "mongoose";

import { logger } from "./utils/logger.js";
import mediaRoute from "./routes/media-routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import { handlePostDeleted } from "./event-handlers/media-event-handlers.js";

const app = express();
const PORT = process.env.PORT || 3003;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Received body, ${req.body}`);
  next();
});

app.use("/api/media", mediaRoute);

// Error handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();

    // consume all the events

    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Media service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to connect to server`, error);
    process.exit(1);
  }
}

startServer();

app.listen(PORT, () => {
  logger.info(`Media service running on port ${PORT}`);
});

// unhandledRejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at `, promise, " reason: ", reason);
});
