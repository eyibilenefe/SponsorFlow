import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_ERROR_MESSAGES, getUserAccessState } from "@/features/auth/access";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/db";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/api/health",
  "/api/cron/inbox-sync"
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function redirectWithCookies(url: URL, baseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  for (const cookie of baseResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}

function redirectToLogin(request: NextRequest, baseResponse: NextResponse, error?: string) {
  const loginUrl = new URL("/login", request.url);
  if (error) {
    loginUrl.searchParams.set("error", error);
  }
  return redirectWithCookies(loginUrl, baseResponse);
}

export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabasePublicConfig();

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set(name, value);
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set(name, "");
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = isPublicPath(pathname);

  if (!user) {
    if (isPublic) {
      return response;
    }
    return redirectToLogin(request, response);
  }

  const access = await getUserAccessState(supabase, user);
  if (!access.allowed) {
    await supabase.auth.signOut();
    return redirectToLogin(request, response, access.reason ?? AUTH_ERROR_MESSAGES.approvalPending);
  }

  if (pathname === "/login") {
    return redirectWithCookies(new URL("/dashboard", request.url), response);
  }

  return response;
}
