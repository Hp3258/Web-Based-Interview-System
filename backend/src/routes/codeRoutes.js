import express from "express";
import { runCode } from "../controllers/codeController.js";
import { protectRoute } from "../middleware/protectRoutes.js";

const router = express.Router();

// protectRoute populates req.user
router.post("/run", protectRoute, runCode);

export default router;
