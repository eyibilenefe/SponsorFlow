import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { signInAction, signUpAction } from "@/features/auth/actions";

interface LoginPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = readParam(searchParams.error);
  const success = readParam(searchParams.success);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-8 shadow-sm">
          <p className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-primary-100">
            SponsorFlow Mini CRM
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Kulup Sponsorluk Paneli</h1>
          <p className="mt-3 max-w-lg text-sm text-slate-700">
            Sponsor adayi firmalari, iletisim kisileri ve e-posta gorusmelerini tek bir akista
            yonetin.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Hizli Kayit</p>
              <p className="mt-1 text-xs text-slate-600">Firma ve kisi ekleyin, etiketleyin.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Toplu Gonderim</p>
              <p className="mt-1 text-xs text-slate-600">Filtreye gore kampanya gonderin.</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4 sm:col-span-2">
              <p className="text-sm font-semibold text-slate-900">Otomatik Yanit Takibi</p>
              <p className="mt-1 text-xs text-slate-600">
                IMAP senkronu ile gelen yanitlari otomatik olarak thread kayitlarina isleyin.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <Card className="p-7">
            <h2 className="text-xl font-semibold text-slate-900">Giris Yap</h2>
            <p className="mt-2 text-sm text-slate-600">Hesabinizla devam edin.</p>

            {error && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            )}

            <form action={signInAction} className="mt-6 space-y-3">
              <div>
                <label htmlFor="signin-email">E-posta</label>
                <input id="signin-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div>
                <label htmlFor="signin-password">Sifre</label>
                <input
                  id="signin-password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full">
                Giris Yap
              </Button>
            </form>
          </Card>

          <Card className="p-7">
            <h2 className="text-xl font-semibold text-slate-900">Yeni Hesap Olustur</h2>
            <p className="mt-2 text-sm text-slate-600">
              Kayit sonrasi hesaplar admin onayi ile aktif edilir. Erisim politikasi{" "}
              <code>ALLOWED_USER_EMAILS</code> degiskeni ile yonetilir.
            </p>
            <form action={signUpAction} className="mt-6 space-y-3">
              <div>
                <label htmlFor="signup-name">Ad Soyad</label>
                <input id="signup-name" name="name" type="text" minLength={2} required />
              </div>
              <div>
                <label htmlFor="signup-email">E-posta</label>
                <input id="signup-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div>
                <label htmlFor="signup-password">Sifre</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" variant="secondary">
                Kayit Ol
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}
