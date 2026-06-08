import express from "express";
import { authenticateRequest } from "../middleware/auth-middleware.js";
import {
  createPost,
  deletePost,
  getAllPost,
  getPost,
} from "../controllers/post-controller.js";

const router = express.Router();

router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/all-posts", getAllPost);
router.get("/get-post/:id", getPost);
router.delete("/:id/", deletePost);

export default router;
