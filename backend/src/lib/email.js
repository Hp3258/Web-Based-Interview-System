import nodemailer from "nodemailer";
import { ENV } from "./env.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.GMAIL_USER,
    pass: ENV.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send an interview session invite email to a candidate.
 * @param {string} toEmail - Candidate's email address
 * @param {string} sessionTitle - Name of the session
 * @param {string} sessionUrl - Full URL to the session page
 * @param {string} hostName - Interviewer's name
 */
export async function sendInviteEmail({ toEmail, sessionTitle, sessionUrl, hostName }) {
  if (!ENV.GMAIL_USER || !ENV.GMAIL_APP_PASSWORD) {
    console.warn("[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping invite email.");
    return { success: false, reason: "Email not configured" };
  }

  const textContent = `Hello,

${hostName} has scheduled an interview session for you.

Session: ${sessionTitle}

To join the interview, please click or copy and paste the link below into your browser:
${sessionUrl}

Best regards,
Interview Team`;

  try {
    const info = await transporter.sendMail({
      from: `"Interview Team" <${ENV.GMAIL_USER}>`,
      to: toEmail,
      subject: `Interview Invite: ${sessionTitle}`,
      text: textContent,
    });

    console.log(`[email] Invite sent to ${toEmail} — Message ID: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error) {
    console.error("[email] Failed to send invite:", error.message);
    return { success: false, reason: error.message };
  }
}
