import { Resend } from "resend";
import { ENV } from "./env.js";

const resend = new Resend(ENV.RESEND_API_KEY || "re_dummy_123");

export const sendInterviewInvite = async ({ to, candidateName, sessionTitle, joinLink }) => {
  try {
    const data = await resend.emails.send({
      from: "Interview System <onboarding@resend.dev>",
      to,
      subject: `Interview Invitation: ${sessionTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Interview Invitation</h2>
          <p>Hi ${candidateName},</p>
          <p>You have been invited to an interview for the position: <strong>${sessionTitle}</strong>.</p>
          <p>Please click the button below to join the interview session when it is time.</p>
          <div style="margin: 30px 0;">
            <a href="${joinLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Interview</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${joinLink}">${joinLink}</a></p>
          <p>Best regards,<br>Interview Team</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Resend Email Error:", error);
    return { success: false, error };
  }
};
