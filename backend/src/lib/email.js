import { ENV } from "./env.js";

/**
 * Send an interview session invite email to a candidate.
 * Since Render blocks SMTP ports, we proxy the email sending through
 * a Vercel Serverless Function deployed with the frontend.
 *
 * @param {string} toEmail       - Candidate's email address
 * @param {string} candidateName - Candidate's name
 * @param {string} sessionTitle  - Name of the interview session
 * @param {string} sessionUrl    - Full join URL sent to the candidate
 * @param {string} hostName      - Interviewer's name
 */
export async function sendInviteEmail({ toEmail, candidateName, sessionTitle, sessionUrl, hostName }) {
  if (!ENV.CLIENT_URL) {
    console.error("[email] ❌ CLIENT_URL is not set in environment variables.");
    return { success: false, reason: "Frontend URL not configured" };
  }

  try {
    const response = await fetch(`${ENV.CLIENT_URL}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toEmail,
        candidateName,
        sessionTitle,
        sessionUrl,
        hostName,
        secret: ENV.STREAM_API_KEY, // simple shared secret
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send email via Vercel API");
    }

    console.log(`[email] ✅ Invite sent to ${toEmail} via Vercel proxy`);
    return { success: true, data };
  } catch (error) {
    console.error("[email] ❌ Failed to send invite:", error.message);
    return { success: false, reason: error.message };
  }
}
