import express from "express";
import { protectRoute } from "../middleware/protectRoutes.js";
import {
  createSession,
  endSession,
  getActiveSessions,
  getMyRecentSessions,
  getSessionById,
  joinSession,
  recordViolation,
  verifyToken,
  updateSession,
  addTranscript,
} from "../controllers/sessionController.js";

const router = express.Router();

router.post("/", protectRoute, createSession);
router.get("/active", protectRoute, getActiveSessions);
router.get("/my-recent", protectRoute, getMyRecentSessions);
router.get("/verify/:token", verifyToken); // No protectRoute so unauthenticated candidates can verify token

router.get("/:id", protectRoute, getSessionById);
router.put("/:id", protectRoute, updateSession);
router.post("/:id/join", protectRoute, joinSession);
router.post("/:id/end", protectRoute, endSession);
router.post("/:id/violations", protectRoute, recordViolation);
router.post("/:id/transcript", protectRoute, addTranscript);

export default router;