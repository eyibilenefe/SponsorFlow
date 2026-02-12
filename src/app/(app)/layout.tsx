import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/session";

export default async function AppLayout({
  children
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
              SponsorFlow
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                className="rounded-full border border-transparent px-3 py-1.5 text-slate-700 transition hover:border-slate-200 hover:bg-slate-100"
                href="/dashboard"
              >
                Panel
              </Link>
              <Link
                className="rounded-full border border-transparent px-3 py-1.5 text-slate-700 transition hover:border-slate-200 hover:bg-slate-100"
                href="/sponsors"
              >
                Sponsorlar
              </Link>
              <Link
                className="rounded-full border border-transparent px-3 py-1.5 text-slate-700 transition hover:border-slate-200 hover:bg-slate-100"
                href="/campaigns/new"
              >
                Kampanyalar
              </Link>
              <Link
                className="rounded-full border border-transparent px-3 py-1.5 text-slate-700 transition hover:border-slate-200 hover:bg-slate-100"
                href="/inbox"
              >
                Gelen Kutusu
              </Link>
              <Link
                className="rounded-full border border-transparent px-3 py-1.5 text-slate-700 transition hover:border-slate-200 hover:bg-slate-100"
                href="/settings/integrations"
              >
                Entegrasyonlar
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{user.email}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost">
                Cikis Yap
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
