"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isEmailAllowed, normalizeEmail } from "@/features/auth/allowlist";
import { signInSchema, signUpSchema } from "@/features/auth/validators";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toLoginError(message: string) {
  return `/login?error=${encodeURIComponent(message)}`;
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: normalizeEmail(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? "")
  });

  if (!parsed.success) {
    redirect(toLoginError("Gecerli bir e-posta ve sifre girin."));
  }

  if (!isEmailAllowed(parsed.data.email)) {
    redirect(toLoginError("Bu hesap SponsorFlow erisim listesinde degil."));
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(toLoginError(error.message));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: normalizeEmail(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? "")
  });

  if (!parsed.success) {
    redirect(toLoginError("Kayit alanlarini dogru doldurun."));
  }

  if (!isEmailAllowed(parsed.data.email)) {
    redirect(toLoginError("Bu e-posta allowlist politikasina takildi."));
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name
      }
    }
  });

  if (error) {
    redirect(toLoginError(error.message));
  }

  redirect("/login?success=Hesap%20olusturuldu.%20Simdi%20giris%20yapabilirsiniz.");
}

export async function signOutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
