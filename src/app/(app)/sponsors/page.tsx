import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/sponsors/StatusBadge";
import {
  createSponsorAction,
  createTagAction,
  updateThreadStatusAction
} from "@/features/sponsors/actions";
import { mapSearchParamsToSponsorFilters } from "@/features/sponsors/mappers";
import { getSponsorFilterOptions, getSponsorList } from "@/features/sponsors/queries";
import { getThreadStatusLabel, THREAD_STATUSES } from "@/types/domain";
import { formatDate } from "@/lib/utils";

interface SponsorsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export default async function SponsorsPage({ searchParams }: SponsorsPageProps) {
  const filters = mapSearchParamsToSponsorFilters(searchParams);
  const [{ tags, owners }, rows] = await Promise.all([
    getSponsorFilterOptions(),
    getSponsorList(filters)
  ]);

  const error = readParam(searchParams.error);
  const success = readParam(searchParams.success);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Sponsorlar</h1>
        <p className="text-sm text-slate-600">
          Sponsor firmalari, iletisim kisileri, etiketler ve surec durumlarini tek ekrandan yonetin.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Yeni Sponsor + Ana Iletisim</h2>
          <form action={createSponsorAction} className="grid gap-3">
            <div>
              <label htmlFor="companyName">Sirket Adi</label>
              <input id="companyName" name="companyName" required />
            </div>
            <div>
              <label htmlFor="website">Web Sitesi</label>
              <input id="website" name="website" placeholder="https://example.com" />
            </div>
            <div>
              <label htmlFor="contactName">Iletisim Kisi</label>
              <input id="contactName" name="contactName" required />
            </div>
            <div>
              <label htmlFor="contactEmail">Iletisim E-postasi</label>
              <input id="contactEmail" name="contactEmail" type="email" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="phone">Telefon</label>
                <input id="phone" name="phone" />
              </div>
              <div>
                <label htmlFor="notes">Notlar</label>
                <input id="notes" name="notes" />
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Etiketler</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name="tagIds" value={tag.id} className="h-4 w-4" />
                    {tag.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <Button type="submit">Sponsor Ekle</Button>
          </form>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Etiket Olustur</h2>
          <form action={createTagAction} className="flex flex-col gap-3 sm:flex-row">
            <input name="name" placeholder="or. finans, teknoloji" required />
            <Button type="submit" className="sm:w-auto">
              Etiket Ekle
            </Button>
          </form>
          <p className="text-sm text-slate-600">
            Etiketler buyuk-kucuk harf duyarsiz (`citext`) ve benzersizdir.
          </p>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Filtreler</h2>
        <p className="text-sm text-slate-600">
          Sirket Ara alani, firma adina gore hizli filtreleme yapar.
        </p>
        <form method="get" className="grid gap-3 md:grid-cols-5">
          <input
            name="search"
            placeholder="Sirket ara..."
            defaultValue={filters.search ?? ""}
          />
          <select name="tagId" defaultValue={filters.tagId ?? ""}>
            <option value="">Tum etiketler</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">Tum durumlar</option>
            {THREAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getThreadStatusLabel(status)}
              </option>
            ))}
          </select>
          <select name="ownerUserId" defaultValue={filters.ownerUserId ?? ""}>
            <option value="">Tum sorumlular</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name || owner.email}
              </option>
            ))}
          </select>
          <Button type="submit">Uygula</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-4 py-3">Sirket</th>
                <th className="px-4 py-3">Iletisim</th>
                <th className="px-4 py-3">Etiketler</th>
                <th className="px-4 py-3">Sorumlu</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Son Hareket</th>
                <th className="px-4 py-3">Hizli Guncelleme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm">
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>
                    Filtrelere uyan sponsor kaydi bulunamadi.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={`${row.companyId}-${row.contactId}`}>
                  <td className="px-4 py-3">
                    <Link className="font-medium text-slate-900" href={`/sponsors/${row.companyId}`}>
                      {row.companyName}
                    </Link>
                    <p className="text-xs text-slate-500">{row.website ?? "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.contactName}</p>
                    <p className="text-xs text-slate-500">{row.contactEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {row.tags.length > 0 ? row.tags.join(", ") : "-"}
                  </td>
                  <td className="px-4 py-3">{row.ownerName ?? "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(row.lastActivityAt)}</td>
                  <td className="px-4 py-3">
                    <form action={updateThreadStatusAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="companyId" value={row.companyId} />
                      <input type="hidden" name="contactId" value={row.contactId} />
                      <input type="hidden" name="threadId" value={row.threadId ?? ""} />
                      {(["WAITING", "REPLIED", "WON", "LOST"] as const).map((status) => (
                        <Button key={status} type="submit" name="status" value={status} variant="secondary">
                          {getThreadStatusLabel(status)}
                        </Button>
                      ))}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
