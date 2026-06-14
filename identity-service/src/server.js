import { config } from "dotenv";
config();

import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import Redis from "ioredis";

import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/identity-service.js";
import productRoutes from "./routes/product-route.js";
import { logger } from "./utils/logger.js";
import { validateLogin } from "./utils/valiation.js";
import { validateToken } from "./middleware/auth-middleware.js";

const app = express();
const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.warn("Mongo connection error"));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

const sensitiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 50,
  standardHeaders: true, // Include rate limit info in res header
  legacyHeaders: false, //
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Received body, ${req.body}`);
  next();
});

const passRedisClient = (req, res, next) => {
  req.redisClient = redisClient;
  next();
};

app.use("/api/auth", passRedisClient, authRoutes);
app.use("/api/auth/products", validateToken, productRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Identity service running on port: ${PORT}`);
});

// unhandledRejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at `, promise, " reason: ", reason);
});
