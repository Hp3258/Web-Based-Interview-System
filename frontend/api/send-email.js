import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4
dns.setDefaultResultOrder("ipv4first");

export default async function handler(req, res) {
  // CORS Headers for Vercel
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { toEmail, candidateName, sessionTitle, sessionUrl, hostName, secret } = req.body;

  // Basic auth
  if (secret !== process.env.VITE_STREAM_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#f4f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7ff;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">🎯 Interview Invitation</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">You've been selected for an interview</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${candidateName || "Candidate"}</strong>,</p>
                  <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                    <strong>${hostName || "Your interviewer"}</strong> has scheduled a technical interview session for you.
                  </p>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;font-weight:600;">SESSION</p>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#1e293b;">${sessionTitle}</p>
                  </div>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${sessionUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(99,102,241,0.4);">
                      Join Interview →
                    </a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Interview Team" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Interview Invite: ${sessionTitle}`,
      html: htmlContent,
    });

    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Vercel Email Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
