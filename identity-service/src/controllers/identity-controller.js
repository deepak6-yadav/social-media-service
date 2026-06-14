// User Registration

import RefreshToken from "../models/RefreshToken.js";
import User from "../models/user.js";
import { setAuthCookies } from "../utils/cookie.js";
import { generateTokens } from "../utils/generatetokens.js";
import { logger } from "../utils/logger.js";
import { validateLogin, validateRegistration } from "../utils/valiation.js";

export const registerUser = async (req, res, next) => {
  logger.info("Registration endpoint hit");

  try {
    const { error } = validateRegistration(req.body);

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    user = new User({ username, email, password });
    await user.save();

    logger.info("User created.", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occured", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// user login
export const login = async (req, res, next) => {
  logger.info("Login endpoint hit");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("Invalid user");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      logger.warn("Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    setAuthCookies(res, user._id.toString(), "role");

    logger.info("User login successfull");

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
      user: user._id,
    });
  } catch (error) {
    logger.error(
      "Failed to login. Either username or password is wrong",
      error,
    );
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// refresh token
export const refreshToken = async (req, res, next) => {
  logger.info("Refresh token endpoint hit");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }

    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("User not found");
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    await RefreshToken.deleteOne({ _id: storedToken._id });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Failed to create refresh token.", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// logout
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token is not provided");
      return res.status(400).json({
        success: false,
        message: "Refresh token is not present",
      });
    }

    const response = await RefreshToken.deleteOne({ token: refreshToken });

    if (response.deletedCount === 0) {
      logger.warn("Error while logging out.", response);
      return res.status(400).json({
        success: false,
        message: "Error while logging out",
      });
    }

    logger.info(`Refresh token deleted for logout`);

    return res.json({
      success: true,
      message: "Logged out successfully",
      data: response,
    });
  } catch (error) {
    logger.error("Error while logging out.", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
