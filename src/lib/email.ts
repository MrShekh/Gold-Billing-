import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER!;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD!;

export function createTransport() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD,
        },
    });
}

export async function sendOtpEmail(toEmail: string, otp: string, username: string) {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        throw new Error("Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local");
    }

    const transporter = createTransport();
    await transporter.sendMail({
        from: `"Gold Billing" <${GMAIL_USER}>`,
        to: toEmail,
        subject: "Password Reset OTP — Gold Billing",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fffdf4; border: 1px solid #e5c96e; border-radius: 12px;">
        <h2 style="color: #b8860b; margin-bottom: 8px;">Gold Billing System</h2>
        <p style="color: #555; margin-bottom: 24px;">Password reset requested for: <strong>${username}</strong></p>
        
        <div style="background: #fff; border: 2px solid #d4a843; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #888; font-size: 13px; margin: 0 0 8px;">Your One-Time Password (OTP)</p>
          <h1 style="font-size: 42px; letter-spacing: 12px; color: #b8860b; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
          <p style="color: #888; font-size: 12px; margin: 12px 0 0;">Valid for <strong>10 minutes</strong></p>
        </div>

        <p style="color: #888; font-size: 12px; margin: 0;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
      </div>
    `,
    });
}
