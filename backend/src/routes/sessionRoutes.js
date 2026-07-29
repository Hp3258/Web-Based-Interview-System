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

// ─── Email smoke-test (remove before final production) ───────────────────────
// POST /api/sessions/test-email   body: { "to": "test@example.com" }
router.post("/test-email", protectRoute, async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: "Provide 'to' email in request body" });

  const result = await sendInviteEmail({
    toEmail: to,
    candidateName: "Test Candidate",
    sessionTitle: "Email Test Session",
    sessionUrl: "https://example.com/interview/join/test-token-123",
    hostName: req.user?.name || "HR",
  });

  if (result.success) {
    return res.json({ message: `✅ Test email sent to ${to}`, data: result.data });
  } else {
    return res.status(500).json({ message: `❌ Email failed: ${result.reason}` });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

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