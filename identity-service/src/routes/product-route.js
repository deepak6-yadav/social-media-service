import express from "express";
import { productsController } from "../controllers/products-controller.js";

const router = express.Router();

router.get("/", productsController);

export default router;
