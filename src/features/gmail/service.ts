import "server-only";

import nodemailer from "nodemailer";

import { env } from "@/lib/env";

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  threadId?: string | null;
}

export interface SendEmailResult {
  gmailMessageId: string;
  gmailThreadId: string;
}

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let cachedTransporter: MailTransporter | null = null;

function getTransporter(): MailTransporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  return cachedTransporter;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function normalizeInternetMessageId(value: string): string {
  const raw = value.trim();
  const bracketMatch = raw.match(/<[^>]+>/);
  if (bracketMatch) {
    return bracketMatch[0].toLowerCase();
  }
  if (raw.includes("@")) {
    return `<${raw.toLowerCase()}>`;
  }
  return raw.toLowerCase();
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const transporter = getTransporter();
  const rootThreadId = input.threadId ? normalizeInternetMessageId(input.threadId) : null;

  const info = await transporter.sendMail({
    from: env.SMTP_FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    text: input.body,
    html: `<p>${escapeHtml(input.body).replaceAll("\n", "<br/>")}</p>`,
    inReplyTo: rootThreadId ?? undefined,
    references: rootThreadId ? [rootThreadId] : undefined
  });

  if (!info.messageId) {
    throw new Error("SMTP provider did not return a message-id.");
  }

  const messageId = normalizeInternetMessageId(info.messageId);
  const logicalThreadId = rootThreadId ?? messageId;

  return {
    gmailMessageId: messageId,
    gmailThreadId: logicalThreadId
  };
}
