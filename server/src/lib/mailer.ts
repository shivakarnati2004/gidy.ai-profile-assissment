import nodemailer from "nodemailer";
import { env } from "./env";

export const sendOtpEmail = async (to: string, code: string) => {
  const subject = "Your profile login code";
  const text = `Your login code is ${code}. It expires in 10 minutes.`;
  const html = `<p>Your login code is <strong>${code}</strong>. It expires in 10 minutes.</p>`;

  if (env.smtpHost && env.smtpFrom) {
    const transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser
        ? {
            user: env.smtpUser,
            pass: env.smtpPass
          }
        : undefined
    });

    await transporter.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text,
      html
    });

    return;
  }

  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  const info = await transporter.sendMail({
    from: "Profile App <no-reply@example.com>",
    to,
    subject,
    text,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`OTP preview URL: ${previewUrl}`);
  }
};
