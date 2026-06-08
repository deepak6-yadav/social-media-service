import { config } from "dotenv";
config();

import express from "express";
import cors from "cors";
import helmet from "helmet";

import Redis from "ioredis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { logger } from "./utils/logger.js";
import proxy from "express-http-proxy";
import { errorHandler } from "./middleware/errorHandler.js";
import { validateToken } from "./middleware/auth-middleware.js";

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Ip based rate limitting for sensitive endpoints
const rateLimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
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
    sendCommand: (...args) => client.call(...args),
  }),
});

app.use(rateLimitOptions);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
    next(err);
  },
};

// Setting up proxy for identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Post Service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

// settting up proxy fro post service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity Service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

// settting up proxy fro post service
app.use(
  "/v1/media",
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
        proxyReqOpts.headers["content-type"] = "application/json";
      }
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Post Service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
    parseReqBody: false,
  }),
);

app.use((req, res, next) => {
  logger.warn("Not a valid endpoint");
  res.json({
    success: false,
    message: "Not a valid endpoint",
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port: ${PORT}`);
  logger.info(
    `Identity Service is running on  ${process.env.IDENTITY_SERVICE_URL}`,
  );
  logger.info(`Post Service is running on  ${process.env.POST_SERVICE_URL}`);
  logger.info(`Media Service is running on  ${process.env.MEDIA_SERVICE_URL}`);
  logger.info(`Redis is running on: ${process.env.REDIS_URL}`);
  logger.info(
    `Search Service is running on: ${process.env.SEARCH_SERVICE_URL}`,
  );
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at `, promise, " reason: ", reason);
});
