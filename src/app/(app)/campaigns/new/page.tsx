import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createCampaignAndSendAction } from "@/features/campaigns/actions";
import { getSponsorFilterOptions } from "@/features/sponsors/queries";
import { getThreadStatusLabel, THREAD_STATUSES } from "@/types/domain";

interface CampaignNewPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export default async function CampaignNewPage({ searchParams }: CampaignNewPageProps) {
  const { tags, owners } = await getSponsorFilterOptions();

  const sent = readParam(searchParams.sent);
  const failed = readParam(searchParams.failed);
  const error = readParam(searchParams.error);
  const info = readParam(searchParams.info);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Toplu E-posta
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Yeni Kampanya</h1>
        <p className="text-sm text-slate-600">
          Filtrelenmis hedef listesine tek adimda toplu e-posta gonderin.
        </p>
      </div>

      {(sent || failed || info) && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {info ?? `Kampanya tamamlandi. Basarili: ${sent ?? 0}, Hatali: ${failed ?? 0}.`}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card className="space-y-4">
        <form action={createCampaignAndSendAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <div>
              <label htmlFor="name">Kampanya Adi</label>
              <input id="name" name="name" required placeholder="Bahar Sponsorluk 2026" />
            </div>
            <div>
              <label htmlFor="subjectTemplate">Konu Sablonu</label>
              <input
                id="subjectTemplate"
                name="subjectTemplate"
                required
                defaultValue="{{companyName}} ile sponsorluk gorusmesi"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Hedef Filtreleri
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="search">Sirket Ara</label>
                <input id="search" name="search" placeholder="sirket adi..." />
              </div>
              <div>
                <label htmlFor="tagId">Etiket</label>
                <select id="tagId" name="tagId" defaultValue="">
                  <option value="">Tum etiketler</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status">Durum</label>
                <select id="status" name="status" defaultValue="">
                  <option value="">Tum durumlar</option>
                  {THREAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getThreadStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ownerUserId">Sorumlu</label>
                <select id="ownerUserId" name="ownerUserId" defaultValue="">
                  <option value="">Tum sorumlular</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name || owner.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="bodyTemplate">Icerik Sablonu</label>
            <textarea
              id="bodyTemplate"
              name="bodyTemplate"
              rows={10}
              required
              defaultValue={`Merhaba {{contactName}},\n\nUniversite kulubumuz adina ulasiyorum. {{companyName}} ile bir sponsorluk is birligi imkani konusmak isteriz.\n\nUygunsaniz gelecek hafta kisa bir gorusme planlayabilir miyiz?\n\nTesekkurler,\nKulup Sponsorluk Ekibi`}
            />
          </div>

          <p className="text-xs text-slate-500">
            Kullanilabilir degiskenler: {"{{contactName}}"}, {"{{contactEmail}}"}, {"{{companyName}}"}.
          </p>

          <Button type="submit">Kampanyayi Olustur ve Gonder</Button>
        </form>
      </Card>
    </div>
  );
}
