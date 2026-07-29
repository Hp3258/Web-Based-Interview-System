import { Resend } from "resend";
import { ENV } from "./env.js";

const resend = new Resend(ENV.RESEND_API_KEY);

export const sendInterviewInvite = async ({ to, candidateName, sessionTitle, joinLink }) => {
  if (!ENV.RESEND_API_KEY) {
    console.warn("[resend] RESEND_API_KEY not set — skipping invite email.");
    return { success: false, reason: "Resend not configured" };
  }

  try {
    const data = await resend.emails.send({
      from: "Interview System <onboarding@resend.dev>",
      to,
      subject: `Interview Invitation: ${sessionTitle}`,
      html: `
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
                      <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${candidateName}</strong>,</p>
                      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                        You have been invited to a technical interview session. Please use the link below to join when you're ready.
                      </p>

                      <!-- Session info box -->
                      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
                        <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;font-weight:600;">SESSION</p>
                        <p style="margin:0;font-size:20px;font-weight:700;color:#1e293b;">${sessionTitle}</p>
                      </div>

                      <!-- CTA Button -->
                      <div style="text-align:center;margin:32px 0;">
                        <a href="${joinLink}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(99,102,241,0.4);">
                          Join Interview →
                        </a>
                      </div>

                      <p style="margin:24px 0 8px;color:#9ca3af;font-size:13px;text-align:center;">Or copy this link into your browser:</p>
                      <p style="margin:0;background:#f1f5f9;border-radius:8px;padding:12px 16px;font-size:12px;color:#6366f1;word-break:break-all;text-align:center;">
                        <a href="${joinLink}" style="color:#6366f1;text-decoration:none;">${joinLink}</a>
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
      `,
    });

    console.log(`[resend] Invite sent to ${to} — ID: ${data?.data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error("[resend] Failed to send invite:", error?.message, JSON.stringify(error?.response?.data || {}));
    return { success: false, reason: error?.message };
  }
};
