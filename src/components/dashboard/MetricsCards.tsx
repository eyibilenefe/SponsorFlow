import { Card } from "@/components/ui/Card";
import type { DashboardMetrics } from "@/types/domain";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const items = [
    {
      label: "Toplam Sponsor",
      value: metrics.totalSponsors,
      accent: "from-sky-100 to-white"
    },
    {
      label: "Yanit Beklenen",
      value: metrics.waitingReplies,
      accent: "from-amber-100 to-white"
    },
    {
      label: "Yanit Gelen",
      value: metrics.replied,
      accent: "from-emerald-100 to-white"
    },
    {
      label: "Kazanilan",
      value: metrics.won,
      accent: "from-blue-100 to-white"
    },
    {
      label: "Kaybedilen",
      value: metrics.lost,
      accent: "from-rose-100 to-white"
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <Card
          key={item.label}
          className={`relative overflow-hidden border-slate-200/90 bg-gradient-to-br ${item.accent}`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-slate-900/10" />
          <p className="text-sm font-medium text-slate-600">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
