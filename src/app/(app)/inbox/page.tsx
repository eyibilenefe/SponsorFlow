import Link from "next/link";

import { StatusBadge } from "@/components/sponsors/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { clearInboundInboxAction } from "@/features/gmail/actions";
import { getInboundMessageFeed } from "@/features/gmail/queries";
import { formatDate } from "@/lib/utils";

interface InboxPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function summarizeBody(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= 280) {
    return clean;
  }
  return `${clean.slice(0, 280)}...`;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const query = (readParam(searchParams.q) ?? "").trim().toLowerCase();
  const success = readParam(searchParams.success);
  const error = readParam(searchParams.error);
  const inboundMessages = await getInboundMessageFeed(150);

  const rows = inboundMessages.filter((message) => {
    if (!query) {
      return true;
    }

    return [
      message.subject,
      message.contactName,
      message.contactEmail,
      message.companyName,
      message.body
    ]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Takip</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Gelen Kutusu</h1>
        <p className="text-sm text-slate-600">
          IMAP sync ile eslesen gelen mailleri buradan izleyebilir, ilgili sponsor kaydina
          gecis yapabilirsiniz.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <Card>
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            placeholder="Konu, kisi veya sirket ara..."
            defaultValue={readParam(searchParams.q) ?? ""}
          />
          <Button type="submit">Ara</Button>
        </form>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <p className="text-sm text-slate-600">Toplam gelen mesaj: {inboundMessages.length}</p>
          <form action={clearInboundInboxAction}>
            <Button type="submit" variant="danger">
              Gelen Kutusunu Temizle
            </Button>
          </form>
        </div>
      </Card>

      <div className="space-y-3">
        {rows.length === 0 && (
          <Card>
            <p className="text-sm text-slate-600">Gosterilecek gelen mail bulunamadi.</p>
          </Card>
        )}

        {rows.map((message) => (
          <Card key={message.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{message.subject || "(konu yok)"}</p>
                <p className="text-xs text-slate-500">{formatDate(message.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {message.threadStatus && <StatusBadge status={message.threadStatus} />}
                {message.companyId && (
                  <Link className="text-sm font-medium" href={`/sponsors/${message.companyId}`}>
                    Sponsor kaydini ac
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
              <p>
                <span className="font-medium text-slate-900">Kisi:</span>{" "}
                {message.contactName ?? "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">E-posta:</span>{" "}
                {message.contactEmail ?? "-"}
              </p>
              <p className="sm:col-span-2">
                <span className="font-medium text-slate-900">Sirket:</span>{" "}
                {message.companyName ?? "-"}
              </p>
            </div>

            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {summarizeBody(message.body || "(mesaj icerigi yok)")}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
