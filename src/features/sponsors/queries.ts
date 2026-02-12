import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardMetrics, SponsorFilters, ThreadStatus } from "@/types/domain";

export interface SponsorFilterOptions {
  tags: Array<{ id: string; name: string }>;
  owners: Array<{ id: string; name: string; email: string }>;
}

export interface SponsorListRow {
  companyId: string;
  companyName: string;
  website: string | null;
  contactId: string;
  contactName: string;
  contactEmail: string;
  phone: string | null;
  threadId: string | null;
  status: ThreadStatus;
  ownerUserId: string | null;
  ownerName: string | null;
  lastActivityAt: string | null;
  tags: string[];
}

export interface CompanyDetail {
  company: {
    id: string;
    name: string;
    website: string | null;
    createdAt: string;
  };
  tags: Array<{ id: string; name: string }>;
  contacts: Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    notes: string | null;
    thread: {
      id: string;
      status: ThreadStatus;
      ownerUserId: string | null;
      ownerName: string | null;
      gmailThreadId: string | null;
      lastActivityAt: string | null;
    } | null;
    messages: Array<{
      id: string;
      direction: "OUTBOUND" | "INBOUND";
      subject: string;
      body: string;
      createdAt: string;
    }>;
  }>;
}

export interface CampaignTargetContact {
  contactId: string;
  contactName: string;
  contactEmail: string;
  companyId: string;
  companyName: string;
  latestThread: {
    id: string;
    status: ThreadStatus;
    gmailThreadId: string | null;
    ownerUserId: string | null;
  } | null;
}

function byDescendingTime(a?: string | null, b?: string | null) {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return bTime - aTime;
}

async function getFilteredCompanies(filters: SponsorFilters) {
  const supabase = createSupabaseServerClient();

  let query = supabase.from("companies").select("id, name, website, created_at");
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data: companies, error: companiesError } = await query.order("name", {
    ascending: true
  });
  if (companiesError) throw companiesError;

  if (!companies || companies.length === 0) {
    return [];
  }

  if (!filters.tagId) {
    return companies;
  }

  const companyIds = companies.map((company) => company.id);
  const { data: tagRows, error: tagsError } = await supabase
    .from("company_tags")
    .select("company_id")
    .eq("tag_id", filters.tagId)
    .in("company_id", companyIds);

  if (tagsError) throw tagsError;

  const allowed = new Set((tagRows ?? []).map((row) => row.company_id));
  return companies.filter((company) => allowed.has(company.id));
}

async function getLatestThreadMap(contactIds: string[]) {
  if (contactIds.length === 0) {
    return new Map<string, { id: string; status: ThreadStatus; owner_user_id: string | null; last_activity_at: string; gmail_thread_id: string | null }>();
  }

  const supabase = createSupabaseServerClient();
  const { data: threads, error } = await supabase
    .from("threads")
    .select("id, contact_id, status, owner_user_id, last_activity_at, gmail_thread_id")
    .in("contact_id", contactIds)
    .order("last_activity_at", { ascending: false });

  if (error) throw error;

  const latestByContact = new Map<
    string,
    {
      id: string;
      status: ThreadStatus;
      owner_user_id: string | null;
      last_activity_at: string;
      gmail_thread_id: string | null;
    }
  >();

  for (const thread of threads ?? []) {
    if (!latestByContact.has(thread.contact_id)) {
      latestByContact.set(thread.contact_id, {
        id: thread.id,
        status: thread.status as ThreadStatus,
        owner_user_id: thread.owner_user_id,
        last_activity_at: thread.last_activity_at,
        gmail_thread_id: thread.gmail_thread_id
      });
    }
  }

  return latestByContact;
}

async function getCompanyTagMap(companyIds: string[]) {
  if (companyIds.length === 0) {
    return new Map<string, string[]>();
  }

  const supabase = createSupabaseServerClient();
  const { data: companyTags, error } = await supabase
    .from("company_tags")
    .select("company_id, tag_id")
    .in("company_id", companyIds);
  if (error) throw error;

  const tagIds = Array.from(new Set((companyTags ?? []).map((row) => row.tag_id)));
  const tagNameById = new Map<string, string>();

  if (tagIds.length > 0) {
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("id, name")
      .in("id", tagIds);
    if (tagsError) throw tagsError;
    for (const tag of tags ?? []) {
      tagNameById.set(tag.id, tag.name);
    }
  }

  const result = new Map<string, string[]>();
  for (const row of companyTags ?? []) {
    const tagName = tagNameById.get(row.tag_id);
    if (!tagName) continue;
    const current = result.get(row.company_id) ?? [];
    current.push(tagName);
    result.set(row.company_id, current);
  }
  return result;
}

async function getUserMap(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, { id: string; name: string; email: string }>();
  }
  const supabase = createSupabaseServerClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email")
    .in("id", userIds);

  if (error) throw error;

  return new Map((users ?? []).map((user) => [user.id, user]));
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createSupabaseServerClient();

  const [
    totalSponsorsResult,
    waitingResult,
    repliedResult,
    wonResult,
    lostResult
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("threads").select("*", { count: "exact", head: true }).eq("status", "WAITING"),
    supabase.from("threads").select("*", { count: "exact", head: true }).eq("status", "REPLIED"),
    supabase.from("threads").select("*", { count: "exact", head: true }).eq("status", "WON"),
    supabase.from("threads").select("*", { count: "exact", head: true }).eq("status", "LOST")
  ]);

  return {
    totalSponsors: totalSponsorsResult.count ?? 0,
    waitingReplies: waitingResult.count ?? 0,
    replied: repliedResult.count ?? 0,
    won: wonResult.count ?? 0,
    lost: lostResult.count ?? 0
  };
}

export async function getSponsorFilterOptions(): Promise<SponsorFilterOptions> {
  const supabase = createSupabaseServerClient();
  const [{ data: tags, error: tagsError }, { data: owners, error: ownersError }] =
    await Promise.all([
      supabase.from("tags").select("id, name").order("name", { ascending: true }),
      supabase.from("users").select("id, name, email").order("name", { ascending: true })
    ]);

  if (tagsError) throw tagsError;
  if (ownersError) throw ownersError;

  return {
    tags: tags ?? [],
    owners: owners ?? []
  };
}

export async function getSponsorList(filters: SponsorFilters): Promise<SponsorListRow[]> {
  const companies = await getFilteredCompanies(filters);
  if (companies.length === 0) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const companyById = new Map(companies.map((company) => [company.id, company]));
  const companyIds = companies.map((company) => company.id);

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, company_id, full_name, email, phone")
    .in("company_id", companyIds)
    .order("full_name", { ascending: true });
  if (contactsError) throw contactsError;

  const contactRows = contacts ?? [];
  const contactIds = contactRows.map((contact) => contact.id);
  const latestThreadMap = await getLatestThreadMap(contactIds);
  const tagMap = await getCompanyTagMap(companyIds);

  const ownerIds = Array.from(
    new Set(
      Array.from(latestThreadMap.values())
        .map((thread) => thread.owner_user_id)
        .filter((ownerId): ownerId is string => Boolean(ownerId))
    )
  );
  const ownerMap = await getUserMap(ownerIds);

  const rows = contactRows
    .map((contact) => {
      const company = companyById.get(contact.company_id);
      if (!company) return null;
      const latestThread = latestThreadMap.get(contact.id) ?? null;
      const status = (latestThread?.status ?? "NEW") as ThreadStatus;
      const ownerName =
        latestThread?.owner_user_id ? ownerMap.get(latestThread.owner_user_id)?.name ?? null : null;

      return {
        companyId: company.id,
        companyName: company.name,
        website: company.website,
        contactId: contact.id,
        contactName: contact.full_name,
        contactEmail: contact.email,
        phone: contact.phone,
        threadId: latestThread?.id ?? null,
        status,
        ownerUserId: latestThread?.owner_user_id ?? null,
        ownerName,
        lastActivityAt: latestThread?.last_activity_at ?? null,
        tags: tagMap.get(company.id) ?? []
      } satisfies SponsorListRow;
    })
    .filter((row): row is SponsorListRow => Boolean(row))
    .filter((row) => {
      if (filters.status && row.status !== filters.status) {
        return false;
      }
      if (filters.ownerUserId && row.ownerUserId !== filters.ownerUserId) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const activityComparison = byDescendingTime(a.lastActivityAt, b.lastActivityAt);
      if (activityComparison !== 0) return activityComparison;
      const companyComparison = a.companyName.localeCompare(b.companyName);
      if (companyComparison !== 0) return companyComparison;
      return a.contactName.localeCompare(b.contactName);
    });

  return rows;
}

export async function getCompanyDetail(companyId: string): Promise<CompanyDetail | null> {
  const supabase = createSupabaseServerClient();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, website, created_at")
    .eq("id", companyId)
    .maybeSingle();
  if (companyError) throw companyError;
  if (!company) return null;

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, full_name, email, phone, notes")
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });
  if (contactsError) throw contactsError;

  const contactRows = contacts ?? [];
  const contactIds = contactRows.map((contact) => contact.id);

  let threads:
    | Array<{
        id: string;
        contact_id: string;
        status: string;
        owner_user_id: string | null;
        gmail_thread_id: string | null;
        last_activity_at: string;
      }>
    | null = [];

  if (contactIds.length > 0) {
    const { data, error: threadsError } = await supabase
      .from("threads")
      .select("id, contact_id, status, owner_user_id, gmail_thread_id, last_activity_at")
      .in("contact_id", contactIds)
      .order("last_activity_at", { ascending: false });
    if (threadsError) throw threadsError;
    threads = data;
  }

  const latestThreadByContact = new Map<
    string,
    {
      id: string;
      status: ThreadStatus;
      owner_user_id: string | null;
      gmail_thread_id: string | null;
      last_activity_at: string;
    }
  >();
  for (const thread of threads ?? []) {
    if (!latestThreadByContact.has(thread.contact_id)) {
      latestThreadByContact.set(thread.contact_id, {
        id: thread.id,
        status: thread.status as ThreadStatus,
        owner_user_id: thread.owner_user_id,
        gmail_thread_id: thread.gmail_thread_id,
        last_activity_at: thread.last_activity_at
      });
    }
  }

  const threadIds = Array.from(latestThreadByContact.values()).map((thread) => thread.id);
  let messages:
    | Array<{
        id: string;
        thread_id: string;
        direction: "OUTBOUND" | "INBOUND";
        subject: string;
        body: string;
        created_at: string;
      }>
    | null = [];
  if (threadIds.length > 0) {
    const { data, error: messagesError } = await supabase
      .from("messages")
      .select("id, thread_id, direction, subject, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false });
    if (messagesError) throw messagesError;
    messages = data;
  }

  const messagesByThread = new Map<
    string,
    Array<{
      id: string;
      direction: "OUTBOUND" | "INBOUND";
      subject: string;
      body: string;
      createdAt: string;
    }>
  >();
  for (const message of messages ?? []) {
    const current = messagesByThread.get(message.thread_id) ?? [];
    current.push({
      id: message.id,
      direction: message.direction,
      subject: message.subject,
      body: message.body,
      createdAt: message.created_at
    });
    messagesByThread.set(message.thread_id, current);
  }

  const ownerIds = Array.from(
    new Set(
      Array.from(latestThreadByContact.values())
        .map((thread) => thread.owner_user_id)
        .filter((ownerId): ownerId is string => Boolean(ownerId))
    )
  );
  const ownerMap = await getUserMap(ownerIds);

  const { data: companyTags, error: companyTagsError } = await supabase
    .from("company_tags")
    .select("tag_id")
    .eq("company_id", companyId);
  if (companyTagsError) throw companyTagsError;

  const tagIds = (companyTags ?? []).map((row) => row.tag_id);
  let tags: Array<{ id: string; name: string }> | null = [];
  if (tagIds.length > 0) {
    const { data, error: tagsError } = await supabase
      .from("tags")
      .select("id, name")
      .in("id", tagIds)
      .order("name", { ascending: true });
    if (tagsError) throw tagsError;
    tags = data;
  }

  return {
    company: {
      id: company.id,
      name: company.name,
      website: company.website,
      createdAt: company.created_at
    },
    tags: tags ?? [],
    contacts: contactRows.map((contact) => {
      const thread = latestThreadByContact.get(contact.id) ?? null;
      const ownerName =
        thread?.owner_user_id ? ownerMap.get(thread.owner_user_id)?.name ?? null : null;
      return {
        id: contact.id,
        fullName: contact.full_name,
        email: contact.email,
        phone: contact.phone,
        notes: contact.notes,
        thread: thread
          ? {
              id: thread.id,
              status: thread.status,
              ownerUserId: thread.owner_user_id,
              ownerName,
              gmailThreadId: thread.gmail_thread_id,
              lastActivityAt: thread.last_activity_at
            }
          : null,
        messages: thread ? messagesByThread.get(thread.id) ?? [] : []
      };
    })
  };
}

export async function getCampaignTargetContacts(
  filters: SponsorFilters
): Promise<CampaignTargetContact[]> {
  const companies = await getFilteredCompanies(filters);
  if (companies.length === 0) {
    return [];
  }
  const companyIds = companies.map((company) => company.id);
  const companyById = new Map(companies.map((company) => [company.id, company]));
  const supabase = createSupabaseServerClient();

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, company_id, full_name, email")
    .in("company_id", companyIds)
    .order("full_name", { ascending: true });
  if (contactsError) throw contactsError;

  const validContacts = (contacts ?? []).filter((contact) => Boolean(contact.email?.trim()));
  const latestThreadMap = await getLatestThreadMap(validContacts.map((contact) => contact.id));

  const rows = validContacts
    .map((contact) => {
      const company = companyById.get(contact.company_id);
      if (!company) return null;
      const latestThread = latestThreadMap.get(contact.id);
      const status = (latestThread?.status ?? "NEW") as ThreadStatus;

      if (filters.status && status !== filters.status) {
        return null;
      }
      if (filters.ownerUserId && latestThread?.owner_user_id !== filters.ownerUserId) {
        return null;
      }

      return {
        contactId: contact.id,
        contactName: contact.full_name,
        contactEmail: contact.email,
        companyId: company.id,
        companyName: company.name,
        latestThread: latestThread
          ? {
              id: latestThread.id,
              status: latestThread.status,
              gmailThreadId: latestThread.gmail_thread_id,
              ownerUserId: latestThread.owner_user_id
            }
          : null
      } satisfies CampaignTargetContact;
    })
    .filter((row): row is CampaignTargetContact => Boolean(row));

  return rows;
}
