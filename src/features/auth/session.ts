import "server-only";

import { redirect } from "next/navigation";

import { AUTH_ERROR_MESSAGES, getUserAccessState } from "@/features/auth/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toLoginError(message: string) {
  return `/login?error=${encodeURIComponent(message)}`;
}

export async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const access = await getUserAccessState(supabase, user);
  if (!access.allowed) {
    await supabase.auth.signOut();
    redirect(toLoginError(access.reason ?? AUTH_ERROR_MESSAGES.approvalPending));
  }

  return user;
}
