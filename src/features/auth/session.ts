import "server-only";

import { redirect } from "next/navigation";

import { isEmailAllowed } from "@/features/auth/allowlist";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !isEmailAllowed(user.email)) {
    redirect("/login");
  }

  return user;
}
