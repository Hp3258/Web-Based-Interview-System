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
import { sendInviteEmail } from "../lib/email.js";

const router = express.Router();

// ─── Email smoke-test ───────────────────────────────────────────────────────
// GET /api/sessions/test-email?to=anyemail@gmail.com
router.get("/test-email", async (req, res) => {
  const to = req.query.to;
  if (!to) return res.status(400).json({ message: "Add ?to=youremail@gmail.com to the URL" });

  const result = await sendInviteEmail({
    toEmail: to,
    candidateName: "Test Candidate",
    sessionTitle: "Email Test Session",
    sessionUrl: "https://example.com/interview/join/test-token-123",
    hostName: "HR Team",
  });

  if (result.success) {
    return res.json({ success: true, message: `✅ Email sent to ${to}` });
  } else {
    return res.status(500).json({ success: false, error: result.reason });
  }
});
// ────────────────────────────────────────────────────────────────────────────

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