import express from "express";
import {
  login,
  logout,
  refreshToken,
  registerUser,
} from "../controllers/identity-controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/refreshToken", refreshToken);
router.post("/logout", logout);

export default router;
