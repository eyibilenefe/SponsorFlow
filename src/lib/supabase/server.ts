import "server-only";

import { createServerClient, type CookieOptions, type SupabaseClientOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/db";

export interface SupabaseServerClientOptions {
  allowCookieMutations?: boolean;
}

export function createSupabaseServerClient(options?: SupabaseServerClientOptions) {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabasePublicConfig();
  const allowMutations = Boolean(options?.allowCookieMutations);

  const cookieHandlers = {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, cookieOptions: CookieOptions) {
      if (!allowMutations) return;
      cookieStore.set(name, value, cookieOptions);
    },
    remove(name: string, cookieOptions: CookieOptions) {
      if (!allowMutations) return;
      cookieStore.set(name, "", { ...cookieOptions, maxAge: 0 });
    }
  };

  const authOverrides: SupabaseClientOptions<Database>["auth"] | undefined = allowMutations
    ? undefined
    : {
        autoRefreshToken: false,
        persistSession: false
      };

  return createServerClient<Database>(url, anonKey, {
    cookies: cookieHandlers,
    auth: authOverrides
  });
}
