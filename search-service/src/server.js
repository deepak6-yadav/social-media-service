import { config } from "dotenv";
config();

import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import searchRoute from "./routes/search-route.js";
import { connectRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import {
  handlePostCreated,
  handlePostDeleted,
} from "./eventHandlers/search-event-handler.js";

const app = express();
const PORT = process.env.PORT;
const redisClient = new Redis(process.env.REDIS_URL);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.warn("Mongo connection error"));

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Received body, ${req.body}`);
  next();
});

const rateLimitter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "post-middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) =>
  rateLimitter
    .consume(req.ip)
    .then(() => next())
    .catch((e) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    }),
);

app.use(
  "/api/search",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  searchRoute,
);

app.use((req, res, next) => {
  logger.warn("Not a valid endpoint...");
  res.json({ success: false, message: "Not a valid endpoint" });
});

app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();

    // consume all the events

    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Search service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to connect to server`, error);
    process.exit(1);
  }
}

startServer();

// unhandledRejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at `, promise, " reason: ", reason);
});
