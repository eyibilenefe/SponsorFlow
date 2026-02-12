"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/features/auth/session";
import { renderTemplate } from "@/features/campaigns/template";
import { createCampaignSchema } from "@/features/campaigns/validators";
import { sendEmail } from "@/features/gmail/service";
import { getCampaignTargetContacts } from "@/features/sponsors/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SponsorFilters } from "@/types/domain";

function campaignRedirectError(message: string): never {
  redirect(`/campaigns/new?error=${encodeURIComponent(message)}`);
}

export async function createCampaignAndSendAction(formData: FormData) {
  const user = await requireUser();
  const parsed = createCampaignSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    subjectTemplate: String(formData.get("subjectTemplate") ?? "").trim(),
    bodyTemplate: String(formData.get("bodyTemplate") ?? "").trim(),
    tagId: (String(formData.get("tagId") ?? "").trim() || undefined) as string | undefined,
    status: (String(formData.get("status") ?? "").trim() || undefined) as
      | SponsorFilters["status"]
      | undefined,
    ownerUserId:
      (String(formData.get("ownerUserId") ?? "").trim() || undefined) as string | undefined,
    search: String(formData.get("search") ?? "").trim() || undefined
  });

  if (!parsed.success) {
    campaignRedirectError(parsed.error.issues[0]?.message ?? "Kampanya verisi gecersiz.");
  }

  const filters: SponsorFilters = {
    tagId: parsed.data.tagId,
    status: parsed.data.status,
    ownerUserId: parsed.data.ownerUserId,
    search: parsed.data.search
  };

  const supabase = createSupabaseServerClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      name: parsed.data.name,
      subject_template: parsed.data.subjectTemplate,
      body_template: parsed.data.bodyTemplate,
      created_by: user.id
    })
    .select("id")
    .single();

  if (campaignError || !campaign) {
    campaignRedirectError(campaignError?.message ?? "Kampanya olusturulamadi.");
  }

  const recipients = await getCampaignTargetContacts(filters);
  if (recipients.length === 0) {
    revalidatePath("/campaigns/new");
    redirect("/campaigns/new?sent=0&failed=0&info=Filtrelere%20uyan%20iletisim%20bulunamadi.");
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    let threadId = recipient.latestThread?.id ?? null;
    let gmailThreadId = recipient.latestThread?.gmailThreadId ?? null;

    if (!threadId) {
      const { data: newThread, error: threadError } = await supabase
        .from("threads")
        .insert({
          contact_id: recipient.contactId,
          status: "NEW",
          owner_user_id: user.id,
          last_activity_at: new Date().toISOString()
        })
        .select("id, gmail_thread_id")
        .single();

      if (threadError || !newThread) {
        failedCount += 1;
        await supabase.from("campaign_recipients").insert({
          campaign_id: campaign.id,
          contact_id: recipient.contactId,
          thread_id: null,
          send_status: "FAILED",
          error_message: threadError?.message ?? "Thread olusturulamadi"
        });
        continue;
      }

      threadId = newThread.id;
      gmailThreadId = newThread.gmail_thread_id;
    }

    const subject = renderTemplate(parsed.data.subjectTemplate, {
      companyName: recipient.companyName,
      contactName: recipient.contactName,
      contactEmail: recipient.contactEmail
    });
    const body = renderTemplate(parsed.data.bodyTemplate, {
      companyName: recipient.companyName,
      contactName: recipient.contactName,
      contactEmail: recipient.contactEmail
    });

    try {
      const sendResult = await sendEmail({
        to: recipient.contactEmail,
        subject,
        body,
        threadId: gmailThreadId
      });

      await supabase
        .from("threads")
        .update({
          status: "WAITING",
          owner_user_id: user.id,
          gmail_thread_id: sendResult.gmailThreadId,
          last_activity_at: new Date().toISOString()
        })
        .eq("id", threadId);

      await supabase.from("messages").insert({
        thread_id: threadId,
        direction: "OUTBOUND",
        subject,
        body,
        gmail_message_id: sendResult.gmailMessageId,
        created_at: new Date().toISOString()
      });

      await supabase.from("campaign_recipients").insert({
        campaign_id: campaign.id,
        contact_id: recipient.contactId,
        thread_id: threadId,
        send_status: "SENT",
        sent_at: new Date().toISOString()
      });
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      await supabase.from("campaign_recipients").insert({
        campaign_id: campaign.id,
        contact_id: recipient.contactId,
        thread_id: threadId,
        send_status: "FAILED",
        error_message: error instanceof Error ? error.message : "Bilinmeyen gonderim hatasi"
      });
    }
  }

  revalidatePath("/campaigns/new");
  revalidatePath("/sponsors");
  revalidatePath("/dashboard");
  redirect(`/campaigns/new?sent=${sentCount}&failed=${failedCount}`);
}
