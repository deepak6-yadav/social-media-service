import winston from "winston";

export const logger = winston.createLogger({
  // debug, warning, notice, alert, error
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(), // enables support for message templating
    winston.format.json(), // formats log in json for structural logging
  ),
  defaultMeta: { service: "identity-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
