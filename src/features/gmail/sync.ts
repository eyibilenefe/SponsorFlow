import "server-only";

import * as imaps from "imap-simple";
import { simpleParser } from "mailparser";

import { normalizeInternetMessageId } from "@/features/gmail/service";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface SyncResult {
  checkedThreads: number;
  savedMessages: number;
  repliedThreads: number;
  unmatchedInbound: number;
  errors: Array<{ threadId: string; error: string }>;
}

interface ParsedInboxMessage {
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  from: string;
  subject: string;
  body: string;
  createdAt: string;
}

interface ImapMessagePart {
  which?: string;
  body?: unknown;
}

interface ImapMessageLike {
  parts?: ImapMessagePart[];
}

function resolveDirection(fromHeader: string) {
  const from = fromHeader.toLowerCase();
  const ownedEmails = [env.IMAP_USER.toLowerCase(), env.SMTP_FROM_EMAIL.toLowerCase()];
  if (ownedEmails.some((email) => from.includes(`<${email}>`) || from.includes(email))) {
    return "OUTBOUND" as const;
  }
  return "INBOUND" as const;
}

function maxDate(values: string[]): string {
  if (values.length === 0) return new Date().toISOString();
  const timestamps = values.map((value) => new Date(value).getTime()).filter(Number.isFinite);
  if (timestamps.length === 0) return new Date().toISOString();
  return new Date(Math.max(...timestamps)).toISOString();
}

function formatImapSinceDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  return `${date.getUTCDate()}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
}

function parseReferences(value: string | null): string[] {
  if (!value) return [];
  const ids = value.match(/<[^>]+>/g) ?? value.split(/\s+/);
  return ids
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => normalizeInternetMessageId(id));
}

function extractEmailAddress(fromHeader: string): string | null {
  const angleBracket = fromHeader.match(/<([^>]+)>/);
  if (angleBracket?.[1]) {
    return angleBracket[1].trim().toLowerCase();
  }

  const plainEmail = fromHeader.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return plainEmail ? plainEmail[0].toLowerCase() : null;
}

function toSingleReferenceValue(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value.find((item) => Boolean(item));
    return first ? String(first) : null;
  }
  return String(value);
}

function toReferenceString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => String(item)).join(" ");
  return String(value);
}

async function fetchImapInboxMessages(): Promise<ParsedInboxMessage[]> {
  const connection = await imaps.connect({
    imap: {
      user: env.IMAP_USER,
      password: env.IMAP_PASS,
      host: env.IMAP_HOST,
      port: env.IMAP_PORT,
      tls: env.IMAP_TLS,
      tlsOptions: {
        rejectUnauthorized: env.IMAP_TLS_REJECT_UNAUTHORIZED
      },
      authTimeout: 10000
    }
  });

  try {
    await connection.openBox(env.IMAP_MAILBOX);

    const sinceDate = new Date(Date.now() - env.IMAP_LOOKBACK_HOURS * 60 * 60 * 1000);
    const searchCriteria = [["SINCE", formatImapSinceDate(sinceDate)]];
    const fetchOptions = {
      bodies: [""],
      markSeen: false
    };

    const messages = await connection.search(searchCriteria as never, fetchOptions as never);
    const parsedMessages: ParsedInboxMessage[] = [];

    for (const rawMessage of messages as unknown[]) {
      try {
        if (!rawMessage || typeof rawMessage !== "object") {
          continue;
        }

        const message = rawMessage as ImapMessageLike;
        const rawPart = (message.parts ?? []).find((part) => part.which === "");
        if (!rawPart?.body || typeof rawPart.body !== "string") {
          continue;
        }

        const mail = await simpleParser(rawPart.body);
        if (!mail.messageId) {
          continue;
        }

        const messageId = normalizeInternetMessageId(mail.messageId);
        const inReplyToRaw = toSingleReferenceValue(mail.inReplyTo);
        const referencesRaw = toReferenceString(mail.references);

        parsedMessages.push({
          messageId,
          inReplyTo: inReplyToRaw ? normalizeInternetMessageId(inReplyToRaw) : null,
          references: parseReferences(referencesRaw),
          from: mail.from?.text ?? "",
          subject: mail.subject ?? "(konu yok)",
          body: mail.text ?? (typeof mail.html === "string" ? mail.html : ""),
          createdAt: mail.date ? mail.date.toISOString() : new Date().toISOString()
        });
      } catch {
        continue;
      }
    }

    return parsedMessages;
  } finally {
    connection.end();
  }
}

export async function syncRepliesForWaitingThreads(): Promise<SyncResult> {
  const admin = createSupabaseAdminClient();
  const { data: threads, error: threadsError } = await admin
    .from("threads")
    .select("id, contact_id, gmail_thread_id, status")
    .in("status", ["WAITING", "SENT"])
    .not("gmail_thread_id", "is", null);

  if (threadsError) {
    throw threadsError;
  }

  const waitingThreads = threads ?? [];
  let savedMessages = 0;
  let repliedThreads = 0;
  let unmatchedInbound = 0;
  const errors: Array<{ threadId: string; error: string }> = [];

  if (waitingThreads.length === 0) {
    return {
      checkedThreads: 0,
      savedMessages,
      repliedThreads,
      unmatchedInbound,
      errors
    };
  }

  const waitingContactIds = Array.from(new Set(waitingThreads.map((thread) => thread.contact_id)));
  const { data: contacts, error: contactsError } = await admin
    .from("contacts")
    .select("id, email")
    .in("id", waitingContactIds);
  if (contactsError) {
    throw contactsError;
  }

  const contactEmailById = new Map(
    (contacts ?? []).map((contact) => [contact.id, String(contact.email).trim().toLowerCase()])
  );

  const waitingThreadIdsByContactEmail = new Map<string, string[]>();
  for (const thread of waitingThreads) {
    const contactEmail = contactEmailById.get(thread.contact_id);
    if (!contactEmail) continue;
    const current = waitingThreadIdsByContactEmail.get(contactEmail) ?? [];
    current.push(thread.id);
    waitingThreadIdsByContactEmail.set(contactEmail, current);
  }

  const threadIdByRootMessageId = new Map<string, string>();
  const threadById = new Map(waitingThreads.map((thread) => [thread.id, thread]));
  for (const thread of waitingThreads) {
    if (!thread.gmail_thread_id) continue;
    threadIdByRootMessageId.set(normalizeInternetMessageId(thread.gmail_thread_id), thread.id);
  }

  const threadIds = waitingThreads.map((thread) => thread.id);
  const { data: knownMessages, error: knownMessagesError } = await admin
    .from("messages")
    .select("thread_id, gmail_message_id")
    .in("thread_id", threadIds);
  if (knownMessagesError) {
    throw knownMessagesError;
  }

  const threadIdByAnyMessageId = new Map<string, string>();
  for (const row of knownMessages ?? []) {
    threadIdByAnyMessageId.set(normalizeInternetMessageId(row.gmail_message_id), row.thread_id);
  }

  let inboxMessages: ParsedInboxMessage[] = [];
  try {
    inboxMessages = await fetchImapInboxMessages();
  } catch (error) {
    return {
      checkedThreads: waitingThreads.length,
      savedMessages,
      repliedThreads,
      unmatchedInbound,
      errors: [
        {
          threadId: "imap",
          error: error instanceof Error ? error.message : "IMAP fetch failed"
        }
      ]
    };
  }

  const candidateRows: Array<{
    threadId: string;
    direction: "OUTBOUND" | "INBOUND";
    subject: string;
    body: string;
    gmailMessageId: string;
    createdAt: string;
  }> = [];

  for (const message of inboxMessages) {
    const direction = resolveDirection(message.from);
    const relationIds = [message.inReplyTo, ...message.references].filter(
      (value): value is string => Boolean(value)
    );

    let matchedThreadId: string | null = null;
    for (const relationId of relationIds) {
      const byRoot = threadIdByRootMessageId.get(relationId);
      if (byRoot) {
        matchedThreadId = byRoot;
        break;
      }

      const byAnyMessage = threadIdByAnyMessageId.get(relationId);
      if (byAnyMessage) {
        matchedThreadId = byAnyMessage;
        break;
      }
    }

    if (!matchedThreadId && direction === "INBOUND") {
      const senderEmail = extractEmailAddress(message.from);
      if (senderEmail) {
        const candidateThreadIds = waitingThreadIdsByContactEmail.get(senderEmail) ?? [];
        if (candidateThreadIds.length === 1) {
          matchedThreadId = candidateThreadIds[0];
        }
      }
    }

    if (!matchedThreadId || !threadById.has(matchedThreadId)) {
      if (direction === "INBOUND") {
        unmatchedInbound += 1;
      }
      continue;
    }

    candidateRows.push({
      threadId: matchedThreadId,
      direction,
      subject: message.subject,
      body: message.body,
      gmailMessageId: message.messageId,
      createdAt: message.createdAt
    });
    threadIdByAnyMessageId.set(message.messageId, matchedThreadId);
  }

  if (candidateRows.length === 0) {
    return {
      checkedThreads: waitingThreads.length,
      savedMessages,
      repliedThreads,
      unmatchedInbound,
      errors
    };
  }

  const uniqueCandidatesById = new Map<string, (typeof candidateRows)[number]>();
  for (const row of candidateRows) {
    if (!uniqueCandidatesById.has(row.gmailMessageId)) {
      uniqueCandidatesById.set(row.gmailMessageId, row);
    }
  }
  const dedupedCandidateRows = Array.from(uniqueCandidatesById.values());

  const candidateMessageIds = dedupedCandidateRows.map((row) => row.gmailMessageId);
  const { data: existingRows, error: existingRowsError } = await admin
    .from("messages")
    .select("gmail_message_id")
    .in("gmail_message_id", candidateMessageIds);
  if (existingRowsError) {
    throw existingRowsError;
  }

  const existingIds = new Set(
    (existingRows ?? []).map((row) => normalizeInternetMessageId(row.gmail_message_id))
  );
  const insertRows = dedupedCandidateRows.filter((row) => !existingIds.has(row.gmailMessageId));

  if (insertRows.length === 0) {
    return {
      checkedThreads: waitingThreads.length,
      savedMessages,
      repliedThreads,
      unmatchedInbound,
      errors
    };
  }

  const { error: insertError } = await admin.from("messages").upsert(
    insertRows.map((row) => ({
      thread_id: row.threadId,
      direction: row.direction,
      subject: row.subject,
      body: row.body,
      gmail_message_id: row.gmailMessageId,
      created_at: row.createdAt
    })),
    { onConflict: "gmail_message_id", ignoreDuplicates: true }
  );
  if (insertError) {
    throw insertError;
  }

  savedMessages = insertRows.length;

  const rowsByThread = new Map<string, typeof insertRows>();
  for (const row of insertRows) {
    const current = rowsByThread.get(row.threadId) ?? [];
    current.push(row);
    rowsByThread.set(row.threadId, current);
  }

  for (const [threadId, rows] of rowsByThread) {
    const hasInbound = rows.some((row) => row.direction === "INBOUND");
    const updatePayload: Record<string, string> = {
      last_activity_at: maxDate(rows.map((row) => row.createdAt))
    };
    if (hasInbound) {
      updatePayload.status = "REPLIED";
      repliedThreads += 1;
    }

    const { error: updateError } = await admin
      .from("threads")
      .update(updatePayload)
      .eq("id", threadId);
    if (updateError) {
      errors.push({
        threadId,
        error: updateError.message
      });
    }
  }

  return {
    checkedThreads: waitingThreads.length,
    savedMessages,
    repliedThreads,
    unmatchedInbound,
    errors
  };
}
