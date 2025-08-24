import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import fs from "node:fs";

type SendParams = { to: string; subject: string; html: string; text?: string };

const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
const secure = process.env.SMTP_SECURE === "true"; // true => SMTPS 465, false => STARTTLS 587
const port = Number(process.env.SMTP_PORT ?? (secure ? 465 : 587));

const tlsOptions: SMTPTransport.Options["tls"] = {
  ...(process.env.SMTP_ACCEPT_SELF_SIGNED === "true" ? { rejectUnauthorized: false } : {}),
  servername: host,
  minVersion: "TLSv1.2",
  ciphers: "TLSv1.2:TLSv1.3",
  ...(process.env.SMTP_CA_PATH ? { ca: [fs.readFileSync(process.env.SMTP_CA_PATH)] } : {}),
};

const smtpOptions: SMTPTransport.Options = {
  host,
  port,
  secure,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  requireTLS: !secure, // sur 587, exigera STARTTLS
  ignoreTLS: process.env.SMTP_IGNORE_TLS === "true", // ex: Mailpit en dev
  tls: tlsOptions,
};

const transporter = nodemailer.createTransport(smtpOptions);

export async function sendMail({ to, subject, html, text }: SendParams) {
  const from = process.env.EMAIL_FROM || "IDKDO <no-reply@localhost>";
  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    return { id: String(info.messageId) };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("SMTP send error:", err);
    throw new Error("Email provider error");
  }
}