import type { SupabaseClient } from "@supabase/supabase-js";

import { isEmailAllowed } from "@/features/auth/allowlist";
import type { Database } from "@/types/db";

export const AUTH_ERROR_MESSAGES = {
  allowlist: "Bu hesap SponsorFlow erisim listesinde degil.",
  approvalPending: "Hesabiniz henuz admin onayi almadi."
} as const;

type AccessClient = Pick<SupabaseClient<Database>, "from">;

interface AccessUser {
  id: string;
  email?: string | null;
}

export interface UserAccessState {
  allowed: boolean;
  reason: string | null;
  isApproved: boolean;
  isAdmin: boolean;
}

export async function getUserAccessState(
  supabase: AccessClient,
  user: AccessUser
): Promise<UserAccessState> {
  if (!isEmailAllowed(user.email)) {
    return {
      allowed: false,
      reason: AUTH_ERROR_MESSAGES.allowlist,
      isApproved: false,
      isAdmin: false
    };
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("is_approved, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return {
      allowed: false,
      reason: AUTH_ERROR_MESSAGES.approvalPending,
      isApproved: false,
      isAdmin: false
    };
  }

  if (!profile.is_approved) {
    return {
      allowed: false,
      reason: AUTH_ERROR_MESSAGES.approvalPending,
      isApproved: false,
      isAdmin: Boolean(profile.is_admin)
    };
  }

  return {
    allowed: true,
    reason: null,
    isApproved: true,
    isAdmin: Boolean(profile.is_admin)
  };
}
