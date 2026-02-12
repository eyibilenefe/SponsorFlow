"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/features/auth/session";
import { syncRepliesForWaitingThreads } from "@/features/gmail/sync";

export async function runInboxSyncNowAction() {
  await requireUser();
  const result = await syncRepliesForWaitingThreads();
  revalidatePath("/settings/integrations");
  revalidatePath("/sponsors");
  revalidatePath("/dashboard");
  revalidatePath("/inbox");

  const params = new URLSearchParams({
    synced: String(result.savedMessages),
    threads: String(result.checkedThreads),
    replied: String(result.repliedThreads),
    unmatched: String(result.unmatchedInbound),
    errors: String(result.errors.length)
  });

  const imapError = result.errors.find((item) => item.threadId === "imap");
  const threadErrors = result.errors.filter((item) => item.threadId !== "imap");
  if (imapError) {
    params.set("imapError", "1");
    params.set("imapErrorMessage", imapError.error);
  }
  if (threadErrors.length > 0) {
    params.set("threadErrors", String(threadErrors.length));
  }

  redirect(`/settings/integrations?${params.toString()}`);
}
