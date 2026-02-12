import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ThreadStatus } from "@/types/domain";

export interface InboundMessageFeedItem {
  id: string;
  gmailMessageId: string;
  threadId: string;
  threadStatus: ThreadStatus | null;
  companyId: string | null;
  companyName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  subject: string;
  body: string;
  createdAt: string;
}

export async function getInboundMessageFeed(limit = 120): Promise<InboundMessageFeedItem[]> {
  const supabase = createSupabaseServerClient();

  const { data: inboundMessages, error: messagesError } = await supabase
    .from("messages")
    .select("id, thread_id, gmail_message_id, subject, body, created_at")
    .eq("direction", "INBOUND")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (messagesError) {
    throw messagesError;
  }

  const messageRows = inboundMessages ?? [];
  if (messageRows.length === 0) {
    return [];
  }

  const threadIds = Array.from(new Set(messageRows.map((message) => message.thread_id)));
  const { data: threads, error: threadsError } = await supabase
    .from("threads")
    .select("id, contact_id, status")
    .in("id", threadIds);

  if (threadsError) {
    throw threadsError;
  }

  const threadById = new Map((threads ?? []).map((thread) => [thread.id, thread]));
  const contactIds = Array.from(new Set((threads ?? []).map((thread) => thread.contact_id)));

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, company_id, full_name, email")
    .in("id", contactIds);

  if (contactsError) {
    throw contactsError;
  }

  const contactById = new Map((contacts ?? []).map((contact) => [contact.id, contact]));
  const companyIds = Array.from(new Set((contacts ?? []).map((contact) => contact.company_id)));

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", companyIds);

  if (companiesError) {
    throw companiesError;
  }

  const companyById = new Map((companies ?? []).map((company) => [company.id, company]));

  return messageRows.map((message) => {
    const thread = threadById.get(message.thread_id);
    const contact = thread ? contactById.get(thread.contact_id) : undefined;
    const company = contact ? companyById.get(contact.company_id) : undefined;

    return {
      id: message.id,
      gmailMessageId: message.gmail_message_id,
      threadId: message.thread_id,
      threadStatus: (thread?.status as ThreadStatus | undefined) ?? null,
      companyId: company?.id ?? null,
      companyName: company?.name ?? null,
      contactName: contact?.full_name ?? null,
      contactEmail: contact?.email ?? null,
      subject: message.subject,
      body: message.body,
      createdAt: message.created_at
    } satisfies InboundMessageFeedItem;
  });
}
