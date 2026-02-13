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

function normalizeMultilineSecret(value: string): string {
  return value.replaceAll("\\n", "\n");
}

function buildDkimConfig() {
  const domainName = env.SMTP_DKIM_DOMAIN_NAME;
  const keySelector = env.SMTP_DKIM_KEY_SELECTOR;
  const privateKey = env.SMTP_DKIM_PRIVATE_KEY;

  if (!domainName && !keySelector && !privateKey) {
    return undefined;
  }

  if (!domainName || !keySelector || !privateKey) {
    throw new Error(
      "DKIM ayari eksik. SMTP_DKIM_DOMAIN_NAME, SMTP_DKIM_KEY_SELECTOR, SMTP_DKIM_PRIVATE_KEY birlikte girilmeli."
    );
  }

  return {
    domainName,
    keySelector,
    privateKey: normalizeMultilineSecret(privateKey)
  };
}

function formatFromAddress() {
  if (!env.SMTP_FROM_NAME) {
    return env.SMTP_FROM_EMAIL;
  }
  const safeName = env.SMTP_FROM_NAME.replaceAll('"', '\\"');
  return `"${safeName}" <${env.SMTP_FROM_EMAIL}>`;
}

function buildListUnsubscribeHeader() {
  const entries: string[] = [];
  if (env.SMTP_LIST_UNSUBSCRIBE_EMAIL) {
    entries.push(`<mailto:${env.SMTP_LIST_UNSUBSCRIBE_EMAIL}>`);
  }
  if (env.SMTP_LIST_UNSUBSCRIBE_URL) {
    entries.push(`<${env.SMTP_LIST_UNSUBSCRIBE_URL}>`);
  }
  if (entries.length === 0) {
    return undefined;
  }
  return entries.join(", ");
}

function getTransporter(): MailTransporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const dkim = buildDkimConfig();
  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    ...(dkim ? { dkim } : {})
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
  const listUnsubscribe = buildListUnsubscribeHeader();

  const info = await transporter.sendMail({
    from: formatFromAddress(),
    replyTo: env.SMTP_REPLY_TO ?? env.SMTP_FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    text: input.body,
    html: `<p>${escapeHtml(input.body).replaceAll("\n", "<br/>")}</p>`,
    inReplyTo: rootThreadId ?? undefined,
    references: rootThreadId ? [rootThreadId] : undefined,
    headers: {
      ...(listUnsubscribe ? { "List-Unsubscribe": listUnsubscribe } : {}),
      ...(env.SMTP_LIST_UNSUBSCRIBE_URL ? { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : {}),
      "X-Auto-Response-Suppress": "OOF, AutoReply"
    }
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
