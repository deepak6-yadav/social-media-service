import jwt from "jsonwebtoken";
import crypto from "crypto";

export function createAccessToken(userId, role) {
  return jwt.sign(
    {
      userId,
      role,
      type: "access",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
}

export function createRefreshToken(userId, role) {
  return jwt.sign(
    {
      userId,
      role,
      type: "refresh",
    },
    "REFRESH_TOKEN",
    {
      expiresIn: "7d",
    },
  );
}

export function createCsrfToken() {
  return crypto.randomBytes(48).toString("hex");
}
