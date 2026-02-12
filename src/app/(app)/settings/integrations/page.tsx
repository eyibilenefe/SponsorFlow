import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { runInboxSyncNowAction } from "@/features/gmail/actions";

interface IntegrationsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export default async function IntegrationsPage({ searchParams }: IntegrationsPageProps) {
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_SECURE &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM_EMAIL
  );
  const imapConfigured = Boolean(
    process.env.IMAP_HOST &&
      process.env.IMAP_PORT &&
      process.env.IMAP_TLS &&
      process.env.IMAP_USER &&
      process.env.IMAP_PASS
  );

  const synced = readParam(searchParams.synced);
  const threads = readParam(searchParams.threads);
  const replied = readParam(searchParams.replied);
  const unmatched = readParam(searchParams.unmatched);
  const errors = readParam(searchParams.errors);
  const imapError = readParam(searchParams.imapError);
  const imapErrorMessage = readParam(searchParams.imapErrorMessage);
  const threadErrors = readParam(searchParams.threadErrors);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Mail Entegrasyonu
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Entegrasyonlar</h1>
        <p className="text-sm text-slate-600">
          Giden e-postalar SMTP (Nodemailer), gelen yanit takibi IMAP (`imap-simple`) ile
          calisir.
        </p>
      </div>

      {(synced || threads || replied) && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Senkron tamamlandi. Kontrol edilen thread: {threads ?? 0}, kaydedilen mesaj: {synced ?? 0},
          yanit durumuna gecen: {replied ?? 0}, eslesmeyen gelen mesaj: {unmatched ?? 0}.
        </p>
      )}
      {imapError === "1" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          IMAP baglanti/okuma hatasi: {imapErrorMessage ?? "Bilinmeyen hata"}.
        </p>
      )}
      {threadErrors && threadErrors !== "0" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Senkron sirasinda {threadErrors} thread guncelleme hatasi alindi. Ayrinti icin sunucu loglarini
          kontrol et.
        </p>
      )}
      {errors && errors !== "0" && imapError !== "1" && !threadErrors && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Senkron sirasinda {errors} hata alindi. Ayrinti icin sunucu loglarini kontrol et.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 bg-gradient-to-br from-white to-sky-50">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">SMTP (Nodemailer)</h2>
            <span
              className={
                smtpConfigured
                  ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
              }
            >
              {smtpConfigured ? "Hazir" : "Eksik"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Zorunlu: <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_SECURE</code>,{" "}
            <code>SMTP_USER</code>, <code>SMTP_PASS</code>, <code>SMTP_FROM_EMAIL</code>
          </p>
        </Card>

        <Card className="space-y-3 bg-gradient-to-br from-white to-emerald-50">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">IMAP (imap-simple)</h2>
            <span
              className={
                imapConfigured
                  ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
              }
            >
              {imapConfigured ? "Hazir" : "Eksik"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Zorunlu: <code>IMAP_HOST</code>, <code>IMAP_PORT</code>, <code>IMAP_TLS</code>,{" "}
            <code>IMAP_USER</code>, <code>IMAP_PASS</code>. Opsiyonel: <code>IMAP_MAILBOX</code>,{" "}
            <code>IMAP_LOOKBACK_HOURS</code>, <code>IMAP_TLS_REJECT_UNAUTHORIZED</code>.
          </p>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Elle Yanit Senkronu</h2>
        <p className="text-sm text-slate-600">
          Zamanlanmis cron disinda, gelen kutusunu anlik kontrol etmek icin bu islemi calistirin.
        </p>
        <form action={runInboxSyncNowAction}>
          <Button type="submit" variant="secondary">
            Simdi Senkronu Calistir
          </Button>
        </form>
        <Link className="text-sm font-medium" href="/inbox">
          Gelen mailleri goruntule
        </Link>
      </Card>
    </div>
  );
}
