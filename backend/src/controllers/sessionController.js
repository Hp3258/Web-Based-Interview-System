import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import crypto from "crypto";
import { sendInviteEmail } from "../lib/email.js";
import { ENV } from "../lib/env.js";

export async function createSession(req, res) {
  try {
    const { title, candidateEmail, candidateName } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Session title is required" });
    }

    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const uniqueToken = crypto.randomBytes(16).toString("hex");

    // store title in the 'problem' field (reusing existing schema field)
    const session = await Session.create({ 
      problem: title.trim(), 
      difficulty: "medium", 
      host: userId, 
      callId,
      uniqueToken,
      candidateEmail,
      candidateName,
      status: "invited"
    });

    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { title: title.trim(), sessionId: session._id.toString() },
      },
    });

    const channel = chatClient.channel("messaging", callId, {
      name: `${title.trim()} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    if (candidateEmail) {
      const sessionUrl = `${ENV.CLIENT_URL}/interview/join/${uniqueToken}`;
      console.log(`\n==========================================`);
      console.log(`INVITE LINK FOR ${candidateName} (${candidateEmail}):`);
      console.log(sessionUrl);
      console.log(`==========================================\n`);

      const emailResult = await sendInviteEmail({
        toEmail: candidateEmail,
        candidateName: candidateName || "Candidate",
        sessionTitle: title.trim(),
        sessionUrl,
        hostName: req.user.name || "Your Interviewer",
      });

      if (!emailResult.success) {
        console.error("[email] Failed to send invite:", emailResult.reason);
      } else {
        console.log(`[email] Invite successfully sent to ${candidateEmail}`);
      }
    }

    res.status(201).json({ session });
  } catch (error) {
    console.log("Error in createSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export async function verifyToken(req, res) {
  try {
    const { token } = req.params;
    const session = await Session.findOne({ uniqueToken: token })
      .populate("host", "name profileImage").lean();

    if (!session) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in verifyToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20).lean();

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20).lean();

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId").lean();

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // Allow joining if session is invited, waiting_approval, or already active
    if (session.status === "completed") {
      return res.status(400).json({ message: "Cannot join a completed session" });
    }

    if (session.host.toString() === userId.toString()) {
      return res.status(400).json({ message: "Host cannot join their own session as participant" });
    }

    // check if session is already full - has a participant
    if (session.participant) return res.status(409).json({ message: "Session is full" });

    session.participant = userId;
    session.status = "active"; // Mark session as active when candidate joins
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // check if user is the host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can end the session" });
    }

    // check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    // delete stream video call
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    // delete stream chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();

    session.status = "completed";
    await session.save();

    res.status(200).json({ session, message: "Session ended successfully" });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function recordViolation(req, res) {
  try {
    const { id } = req.params;
    const { type, description } = req.body;

    const validTypes = ["fullscreen_exit", "tab_switch", "phone_detected", "person_away", "looking_away", "multiple_persons", "external_webcam", "suspicious_object"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid violation type" });
    }

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status !== "active") {
      return res.status(400).json({ message: "Session is not active" });
    }

    session.violations.push({ type, description, timestamp: new Date() });
    await session.save();

    res.status(200).json({
      violationCount: session.violations.length,
      message: "Violation recorded",
    });
  } catch (error) {
    console.log("Error in recordViolation controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateSession(req, res) {
  try {
    const { id } = req.params;
    const { problem, difficulty, code, language } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.host.toString() !== userId.toString() && session.participant?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (problem) session.problem = problem;
    if (difficulty) session.difficulty = difficulty;
    if (code !== undefined) session.code = code;
    if (language) session.language = language;

    await session.save();
    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in updateSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function addTranscript(req, res) {
  try {
    const { id } = req.params;
    const { text, speaker } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Transcript text is required" });
    }

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // Only allow active sessions to append transcript
    if (session.status !== "active" && session.status !== "invited" && session.status !== "waiting_approval") {
      return res.status(400).json({ message: "Session is not active" });
    }

    session.transcript.push({
      speaker: speaker || "candidate",
      text,
      timestamp: new Date()
    });

    await session.save();

    res.status(200).json({ message: "Transcript added" });
  } catch (error) {
    console.log("Error in addTranscript controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}