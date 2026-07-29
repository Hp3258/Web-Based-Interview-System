import nodemailer from "nodemailer";
import { ENV } from "./env.js";
import dns from "dns";

// Force IPv4 resolution. Render sometimes has issues routing IPv6 traffic,
// which causes the ENETUNREACH error when connecting to smtp.gmail.com.
dns.setDefaultResultOrder("ipv4first");

/**
 * Create a fresh transporter each call so env vars are always current.
 * Port 587 + STARTTLS is required on cloud servers (Render, Railway, etc.)
 * Port 465 (SSL) is often blocked or causes handshake failures on cloud hosts.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,      // false = STARTTLS (upgrades the connection after connect)
    requireTLS: true,   // enforce TLS upgrade — never send credentials in plain text
    auth: {
      user: ENV.GMAIL_USER,
      pass: ENV.GMAIL_APP_PASSWORD, // Gmail App Password (not your regular password)
    },
    tls: {
      rejectUnauthorized: false, // avoids cert issues on some cloud environments
    },
  });
}

/**
 * Send an interview session invite email to a candidate.
 * Works for ANY email address — no domain verification required.
 *
 * @param {string} toEmail       - Candidate's email address
 * @param {string} candidateName - Candidate's name
 * @param {string} sessionTitle  - Name of the interview session
 * @param {string} sessionUrl    - Full join URL sent to the candidate
 * @param {string} hostName      - Interviewer's name
 */
export async function sendInviteEmail({ toEmail, candidateName, sessionTitle, sessionUrl, hostName }) {
  if (!ENV.GMAIL_USER || !ENV.GMAIL_APP_PASSWORD) {
    console.error("[email] ❌ GMAIL_USER or GMAIL_APP_PASSWORD is not set in environment variables.");
    return { success: false, reason: "Email credentials not configured on server" };
  }

  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#f4f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7ff;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">🎯 Interview Invitation</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">You've been selected for an interview</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${candidateName || "Candidate"}</strong>,</p>
                  <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                    <strong>${hostName || "Your interviewer"}</strong> has scheduled a technical interview session for you.
                    Please use the link below to join when you are ready.
                  </p>

                  <!-- Session info box -->
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;font-weight:600;">SESSION</p>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#1e293b;">${sessionTitle}</p>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${sessionUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(99,102,241,0.4);">
                      Join Interview →
                    </a>
                  </div>

                  <p style="margin:24px 0 8px;color:#9ca3af;font-size:13px;text-align:center;">Or copy this link into your browser:</p>
                  <p style="margin:0;background:#f1f5f9;border-radius:8px;padding:12px 16px;font-size:12px;color:#6366f1;word-break:break-all;text-align:center;">
                    <a href="${sessionUrl}" style="color:#6366f1;text-decoration:none;">${sessionUrl}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;color:#9ca3af;font-size:13px;">This invite was sent by the Interview System platform.<br>If you weren't expecting this, please ignore this email.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Interview Team" <${ENV.GMAIL_USER}>`,
      to: toEmail,
      subject: `Interview Invite: ${sessionTitle}`,
      html: htmlContent,
    });

    console.log(`[email] ✅ Invite sent to ${toEmail} — Message ID: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error) {
    console.error("[email] ❌ Failed to send invite:", error.message);
    console.error("[email] Full error:", error);
    return { success: false, reason: error.message };
  }
}
