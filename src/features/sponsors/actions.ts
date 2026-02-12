"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeEmail } from "@/features/auth/allowlist";
import { requireUser } from "@/features/auth/session";
import {
  createCompanyContactSchema,
  createSponsorSchema,
  createTagSchema,
  deleteCompanyContactSchema,
  updateCompanyContactSchema,
  updateCompanySchema,
  updateThreadStatusSchema
} from "@/features/sponsors/validators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ThreadStatus } from "@/types/domain";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function sponsorEditPath(companyId: string) {
  return `/sponsors/${companyId}/edit`;
}

export async function createSponsorAction(formData: FormData) {
  const user = await requireUser();
  const tagIds = formData
    .getAll("tagIds")
    .map((value) => String(value))
    .filter(Boolean);

  const parsed = createSponsorSchema.safeParse({
    companyName: String(formData.get("companyName") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim() || undefined,
    contactName: String(formData.get("contactName") ?? "").trim(),
    contactEmail: normalizeEmail(String(formData.get("contactEmail") ?? "")),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
    tagIds
  });

  if (!parsed.success) {
    redirectWithError(
      "/sponsors",
      parsed.error.issues[0]?.message ?? "Sponsor bilgileri gecersiz."
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: parsed.data.companyName,
      website: parsed.data.website ?? null,
      created_by: user.id
    })
    .select("id")
    .single();

  if (companyError || !company) {
    redirectWithError("/sponsors", companyError?.message ?? "Sirket olusturulamadi.");
  }

  const { error: contactError } = await supabase.from("contacts").insert({
    company_id: company.id,
    full_name: parsed.data.contactName,
    email: parsed.data.contactEmail,
    phone: parsed.data.phone ?? null,
    notes: parsed.data.notes ?? null
  });

  if (contactError) {
    await supabase.from("companies").delete().eq("id", company.id);
    redirectWithError("/sponsors", contactError.message);
  }

  if (parsed.data.tagIds.length > 0) {
    const { error: tagsError } = await supabase.from("company_tags").insert(
      parsed.data.tagIds.map((tagId) => ({
        company_id: company.id,
        tag_id: tagId
      }))
    );

    if (tagsError) {
      redirectWithError("/sponsors", tagsError.message);
    }
  }

  revalidatePath("/sponsors");
  revalidatePath("/dashboard");
  redirect("/sponsors?success=Sponsor%20olusturuldu");
}

export async function createTagAction(formData: FormData) {
  const parsed = createTagSchema.safeParse({
    name: String(formData.get("name") ?? "").trim()
  });
  if (!parsed.success) {
    redirectWithError("/sponsors", "Etiket adi gecersiz.");
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("tags").insert({ name: parsed.data.name });

  if (error) {
    redirectWithError("/sponsors", error.message);
  }

  revalidatePath("/sponsors");
  redirect("/sponsors?success=Etiket%20olusturuldu");
}

export async function updateCompanyAction(formData: FormData) {
  await requireUser();

  const parsed = updateCompanySchema.safeParse({
    companyId: String(formData.get("companyId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim() || undefined
  });

  if (!parsed.success) {
    const rawCompanyId = String(formData.get("companyId") ?? "").trim();
    const fallbackPath = rawCompanyId ? sponsorEditPath(rawCompanyId) : "/sponsors";
    redirectWithError(
      fallbackPath,
      parsed.error.issues[0]?.message ?? "Sirket guncelleme verisi gecersiz."
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("companies")
    .update({
      name: parsed.data.name,
      website: parsed.data.website ?? null
    })
    .eq("id", parsed.data.companyId);

  if (error) {
    redirectWithError(sponsorEditPath(parsed.data.companyId), error.message);
  }

  revalidatePath("/sponsors");
  revalidatePath(`/sponsors/${parsed.data.companyId}`);
  revalidatePath(sponsorEditPath(parsed.data.companyId));
  redirect(
    `${sponsorEditPath(parsed.data.companyId)}?success=${encodeURIComponent("Sirket bilgileri guncellendi.")}`
  );
}

export async function createCompanyContactAction(formData: FormData) {
  await requireUser();

  const parsed = createCompanyContactSchema.safeParse({
    companyId: String(formData.get("companyId") ?? "").trim(),
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: normalizeEmail(String(formData.get("email") ?? "")),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined
  });

  if (!parsed.success) {
    const rawCompanyId = String(formData.get("companyId") ?? "").trim();
    const fallbackPath = rawCompanyId ? sponsorEditPath(rawCompanyId) : "/sponsors";
    redirectWithError(
      fallbackPath,
      parsed.error.issues[0]?.message ?? "Iletisim verisi gecersiz."
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("contacts").insert({
    company_id: parsed.data.companyId,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    notes: parsed.data.notes ?? null
  });

  if (error) {
    redirectWithError(sponsorEditPath(parsed.data.companyId), error.message);
  }

  revalidatePath("/sponsors");
  revalidatePath(`/sponsors/${parsed.data.companyId}`);
  revalidatePath(sponsorEditPath(parsed.data.companyId));
  redirect(
    `${sponsorEditPath(parsed.data.companyId)}?success=${encodeURIComponent("Yeni iletisim eklendi.")}`
  );
}

export async function updateCompanyContactAction(formData: FormData) {
  await requireUser();

  const parsed = updateCompanyContactSchema.safeParse({
    companyId: String(formData.get("companyId") ?? "").trim(),
    contactId: String(formData.get("contactId") ?? "").trim(),
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: normalizeEmail(String(formData.get("email") ?? "")),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined
  });

  if (!parsed.success) {
    const rawCompanyId = String(formData.get("companyId") ?? "").trim();
    const fallbackPath = rawCompanyId ? sponsorEditPath(rawCompanyId) : "/sponsors";
    redirectWithError(
      fallbackPath,
      parsed.error.issues[0]?.message ?? "Iletisim guncelleme verisi gecersiz."
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      notes: parsed.data.notes ?? null
    })
    .eq("id", parsed.data.contactId)
    .eq("company_id", parsed.data.companyId);

  if (error) {
    redirectWithError(sponsorEditPath(parsed.data.companyId), error.message);
  }

  revalidatePath("/sponsors");
  revalidatePath(`/sponsors/${parsed.data.companyId}`);
  revalidatePath(sponsorEditPath(parsed.data.companyId));
  redirect(
    `${sponsorEditPath(parsed.data.companyId)}?success=${encodeURIComponent("Iletisim bilgisi guncellendi.")}`
  );
}

export async function deleteCompanyContactAction(formData: FormData) {
  await requireUser();

  const parsed = deleteCompanyContactSchema.safeParse({
    companyId: String(formData.get("companyId") ?? "").trim(),
    contactId: String(formData.get("contactId") ?? "").trim()
  });

  if (!parsed.success) {
    const rawCompanyId = String(formData.get("companyId") ?? "").trim();
    const fallbackPath = rawCompanyId ? sponsorEditPath(rawCompanyId) : "/sponsors";
    redirectWithError(fallbackPath, "Silme verisi gecersiz.");
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", parsed.data.contactId)
    .eq("company_id", parsed.data.companyId);

  if (error) {
    redirectWithError(sponsorEditPath(parsed.data.companyId), error.message);
  }

  revalidatePath("/sponsors");
  revalidatePath(`/sponsors/${parsed.data.companyId}`);
  revalidatePath(sponsorEditPath(parsed.data.companyId));
  redirect(
    `${sponsorEditPath(parsed.data.companyId)}?success=${encodeURIComponent("Iletisim silindi.")}`
  );
}

export async function assignCompanyTagsAction(formData: FormData) {
  await requireUser();

  const companyId = String(formData.get("companyId") ?? "");
  const tagIds = formData
    .getAll("tagIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!companyId) {
    redirectWithError("/sponsors", "Sirket secimi eksik.");
  }

  const supabase = createSupabaseServerClient();
  const { error: deleteError } = await supabase
    .from("company_tags")
    .delete()
    .eq("company_id", companyId);

  if (deleteError) {
    redirectWithError(`/sponsors/${companyId}`, deleteError.message);
  }

  if (tagIds.length > 0) {
    const { error: insertError } = await supabase.from("company_tags").insert(
      tagIds.map((tagId) => ({
        company_id: companyId,
        tag_id: tagId
      }))
    );
    if (insertError) {
      redirectWithError(`/sponsors/${companyId}`, insertError.message);
    }
  }

  revalidatePath(`/sponsors/${companyId}`);
}

export async function updateThreadStatusAction(formData: FormData) {
  const user = await requireUser();
  const parsed = updateThreadStatusSchema.safeParse({
    contactId: String(formData.get("contactId") ?? ""),
    threadId: formData.get("threadId") ? String(formData.get("threadId")) : null,
    companyId: String(formData.get("companyId") ?? ""),
    status: String(formData.get("status") ?? "") as ThreadStatus
  });

  if (!parsed.success) {
    redirectWithError("/sponsors", "Durum guncelleme verisi gecersiz.");
  }

  const supabase = createSupabaseServerClient();
  const lastActivityAt = new Date().toISOString();

  if (parsed.data.threadId) {
    const { error } = await supabase
      .from("threads")
      .update({
        status: parsed.data.status,
        owner_user_id: user.id,
        last_activity_at: lastActivityAt
      })
      .eq("id", parsed.data.threadId);
    if (error) {
      redirectWithError(`/sponsors/${parsed.data.companyId}`, error.message);
    }
  } else {
    const { error } = await supabase.from("threads").insert({
      contact_id: parsed.data.contactId,
      status: parsed.data.status,
      owner_user_id: user.id,
      last_activity_at: lastActivityAt
    });
    if (error) {
      redirectWithError(`/sponsors/${parsed.data.companyId}`, error.message);
    }
  }

  revalidatePath("/sponsors");
  revalidatePath("/dashboard");
  revalidatePath(`/sponsors/${parsed.data.companyId}`);
}
