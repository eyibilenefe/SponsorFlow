import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { Card } from "@/components/ui/Card";
import { getDashboardMetrics } from "@/features/sponsors/queries";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Sponsorluk Ozeti
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Kontrol Paneli</h1>
        <p className="text-sm text-slate-600">
          Surecin guncel durumunu tek bakista takip edin.
        </p>
      </div>

      <MetricsCards metrics={metrics} />

      <Card className="bg-gradient-to-r from-white via-slate-50 to-sky-50">
        <h2 className="text-lg font-semibold text-slate-900">MVP Notu</h2>
        <p className="mt-2 text-sm text-slate-600">
          Toplam sponsor metrigi yalnizca sirket sayisindan hesaplanir. Yanit metrikleri, thread
          durumlarindan beslenir.
        </p>
      </Card>
    </div>
  );
}
