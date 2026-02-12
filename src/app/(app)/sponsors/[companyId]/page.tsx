import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/sponsors/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { assignCompanyTagsAction, updateThreadStatusAction } from "@/features/sponsors/actions";
import { getCompanyDetail, getSponsorFilterOptions } from "@/features/sponsors/queries";
import { formatDate } from "@/lib/utils";
import { getMessageDirectionLabel, getThreadStatusLabel, THREAD_STATUSES } from "@/types/domain";

interface SponsorDetailPageProps {
  params: { companyId: string };
  searchParams: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export default async function SponsorDetailPage({
  params,
  searchParams
}: SponsorDetailPageProps) {
  const [detail, options] = await Promise.all([
    getCompanyDetail(params.companyId),
    getSponsorFilterOptions()
  ]);

  if (!detail) {
    notFound();
  }

  const error = readParam(searchParams.error);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sirket Detayi</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">{detail.company.name}</h1>
        <p className="text-sm text-slate-600">{detail.company.website ?? "Web sitesi yok"}</p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card className="space-y-3 bg-gradient-to-r from-white to-slate-50">
        <h2 className="text-lg font-semibold text-slate-900">Etiketler</h2>
        <p className="text-sm text-slate-600">
          Mevcut: {detail.tags.length > 0 ? detail.tags.map((tag) => tag.name).join(", ") : "-"}
        </p>

        <form action={assignCompanyTagsAction} className="space-y-3">
          <input type="hidden" name="companyId" value={detail.company.id} />
          <div className="grid gap-2 sm:grid-cols-2">
            {options.tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="tagIds"
                  value={tag.id}
                  defaultChecked={detail.tags.some((assigned) => assigned.id === tag.id)}
                  className="h-4 w-4"
                />
                {tag.name}
              </label>
            ))}
          </div>
          <Button type="submit">Etiketleri Kaydet</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {detail.contacts.map((contact) => (
          <Card key={contact.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{contact.fullName}</h3>
                <p className="text-sm text-slate-600">{contact.email}</p>
                <p className="text-sm text-slate-600">{contact.phone ?? "-"}</p>
                {contact.notes && (
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-medium">Not:</span> {contact.notes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <StatusBadge status={contact.thread?.status ?? "NEW"} />
                <p className="mt-1 text-xs text-slate-500">
                  Sorumlu: {contact.thread?.ownerName ?? "Atanmadi"}
                </p>
                <p className="text-xs text-slate-500">
                  Son hareket: {formatDate(contact.thread?.lastActivityAt)}
                </p>
              </div>
            </div>

            <form action={updateThreadStatusAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="companyId" value={detail.company.id} />
              <input type="hidden" name="contactId" value={contact.id} />
              <input type="hidden" name="threadId" value={contact.thread?.id ?? ""} />
              <div className="min-w-[220px]">
                <label htmlFor={`status-${contact.id}`}>Durum Guncelle</label>
                <select
                  id={`status-${contact.id}`}
                  name="status"
                  defaultValue={contact.thread?.status ?? "NEW"}
                >
                  {THREAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getThreadStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="secondary">
                Durumu Kaydet
              </Button>
            </form>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Iletisim Gecmisi
              </h4>
              {contact.messages.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">Henuz e-posta gecmisi yok.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {contact.messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/90 p-3"
                    >
                      <p className="text-xs font-medium text-slate-500">
                        {getMessageDirectionLabel(message.direction)} - {formatDate(message.createdAt)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{message.subject}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
