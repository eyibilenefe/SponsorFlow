import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  createCompanyContactAction,
  deleteCompanyContactAction,
  updateCompanyAction,
  updateCompanyContactAction
} from "@/features/sponsors/actions";
import { getCompanyDetail } from "@/features/sponsors/queries";

interface SponsorEditPageProps {
  params: { companyId: string };
  searchParams: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export default async function SponsorEditPage({ params, searchParams }: SponsorEditPageProps) {
  const detail = await getCompanyDetail(params.companyId);
  if (!detail) {
    notFound();
  }

  const error = readParam(searchParams.error);
  const success = readParam(searchParams.success);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Sponsor Duzenleme
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">{detail.company.name}</h1>
          <p className="text-sm text-slate-600">Sirket ve iletisim bilgilerini guncelleyin.</p>
        </div>
        <Link href={`/sponsors/${detail.company.id}`} className="text-sm font-medium">
          Detay ekranina don
        </Link>
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

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Sirket Bilgileri</h2>
        <form action={updateCompanyAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="companyId" value={detail.company.id} />
          <div>
            <label htmlFor="company-name">Sirket Adi</label>
            <input id="company-name" name="name" defaultValue={detail.company.name} required />
          </div>
          <div>
            <label htmlFor="company-website">Web Sitesi</label>
            <input
              id="company-website"
              name="website"
              defaultValue={detail.company.website ?? ""}
              placeholder="https://example.com"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Sirket Bilgilerini Kaydet</Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Iletisim Kisileri</h2>
        {detail.contacts.length === 0 && (
          <p className="text-sm text-slate-600">Bu sirkete ait iletisim kaydi yok.</p>
        )}

        <div className="space-y-4">
          {detail.contacts.map((contact) => (
            <div key={contact.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <form action={updateCompanyContactAction} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="companyId" value={detail.company.id} />
                <input type="hidden" name="contactId" value={contact.id} />
                <div>
                  <label htmlFor={`contact-name-${contact.id}`}>Ad Soyad</label>
                  <input
                    id={`contact-name-${contact.id}`}
                    name="fullName"
                    defaultValue={contact.fullName}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`contact-email-${contact.id}`}>E-posta</label>
                  <input
                    id={`contact-email-${contact.id}`}
                    name="email"
                    type="email"
                    defaultValue={contact.email}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`contact-phone-${contact.id}`}>Telefon</label>
                  <input id={`contact-phone-${contact.id}`} name="phone" defaultValue={contact.phone ?? ""} />
                </div>
                <div>
                  <label htmlFor={`contact-notes-${contact.id}`}>Not</label>
                  <input id={`contact-notes-${contact.id}`} name="notes" defaultValue={contact.notes ?? ""} />
                </div>
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <Button type="submit" variant="secondary">
                    Iletisim Kaydet
                  </Button>
                </div>
              </form>
              <form action={deleteCompanyContactAction} className="mt-2">
                <input type="hidden" name="companyId" value={detail.company.id} />
                <input type="hidden" name="contactId" value={contact.id} />
                <Button type="submit" variant="danger">
                  Iletisimi Sil
                </Button>
              </form>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Yeni Iletisim Ekle</h2>
        <form action={createCompanyContactAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="companyId" value={detail.company.id} />
          <div>
            <label htmlFor="new-contact-name">Ad Soyad</label>
            <input id="new-contact-name" name="fullName" required />
          </div>
          <div>
            <label htmlFor="new-contact-email">E-posta</label>
            <input id="new-contact-email" name="email" type="email" required />
          </div>
          <div>
            <label htmlFor="new-contact-phone">Telefon</label>
            <input id="new-contact-phone" name="phone" />
          </div>
          <div>
            <label htmlFor="new-contact-notes">Not</label>
            <input id="new-contact-notes" name="notes" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Yeni Iletisim Ekle</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
