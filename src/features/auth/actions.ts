"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AUTH_ERROR_MESSAGES, getUserAccessState } from "@/features/auth/access";
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
    redirect(toLoginError(AUTH_ERROR_MESSAGES.allowlist));
  }

  const supabase = createSupabaseServerClient({ allowCookieMutations: true });
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(toLoginError(error.message));
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toLoginError("Giris sonrasi kullanici dogrulanamadi."));
  }

  const access = await getUserAccessState(supabase, user);
  if (!access.allowed) {
    await supabase.auth.signOut();
    redirect(toLoginError(access.reason ?? AUTH_ERROR_MESSAGES.approvalPending));
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

  const supabase = createSupabaseServerClient({ allowCookieMutations: true });
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

  redirect(
    "/login?success=Kayit%20alindi.%20Hesabiniz%20admin%20onayindan%20sonra%20aktif%20olacak."
  );
}

export async function signOutAction() {
  const supabase = createSupabaseServerClient({ allowCookieMutations: true });
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
