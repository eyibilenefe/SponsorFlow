import { NextRequest, NextResponse } from "next/server";

import { syncRepliesForWaitingThreads } from "@/features/gmail/sync";
import { env } from "@/lib/env";

export const runtime = "nodejs";

function readProvidedSecret(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret) return headerSecret;

  const querySecret = request.nextUrl.searchParams.get("secret");
  if (querySecret) return querySecret;

  return null;
}

export async function GET(request: NextRequest) {
  const providedSecret = readProvidedSecret(request);
  if (!providedSecret || providedSecret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.VERCEL && !request.headers.get("x-vercel-cron")) {
    return NextResponse.json({ error: "Missing Vercel cron header" }, { status: 401 });
  }

  try {
    const result = await syncRepliesForWaitingThreads();
    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Cron sync failed"
      },
      { status: 500 }
    );
  }
}
