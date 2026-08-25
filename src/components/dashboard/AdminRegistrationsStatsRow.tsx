import { ClipboardList, MessageCircle, Sparkle, UserPlus } from "lucide-react";
import { AdminStatCard } from "@/components/dashboard/AdminStatCard";
import { peopleSharePercent } from "@/lib/dashboard/loadAdminPeoplePageStats";
import type { Dictionary } from "@/types/i18n";

export function AdminRegistrationsStatsRow({
  locale,
  labels,
  total,
  pending,
  contacted,
  enrolled,
}: {
  locale: string;
  labels: Dictionary["admin"]["registrations"]["stats"];
  total: number;
  pending: number;
  contacted: number;
  enrolled: number;
}) {
  const fmt = (n: number) => n.toLocaleString(locale);
  const ic = "h-5 w-5";
  const share = (part: number) =>
    labels.shareOfTotal.replace(
      "{{pct}}",
      peopleSharePercent(part, total).toLocaleString(locale, { maximumFractionDigits: 1 }),
    );

  return (
    <div className="relative z-0 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatCard
        icon={<ClipboardList className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-sky-100 text-sky-700"
        label={labels.total}
        value={fmt(total)}
        hint={labels.totalHint}
      />
      <AdminStatCard
        icon={<Sparkle className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-amber-100 text-amber-700"
        label={labels.pending}
        value={fmt(pending)}
        hint={share(pending)}
      />
      <AdminStatCard
        icon={<MessageCircle className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-emerald-100 text-emerald-700"
        label={labels.contacted}
        value={fmt(contacted)}
        hint={share(contacted)}
      />
      <AdminStatCard
        icon={<UserPlus className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-violet-100 text-violet-700"
        label={labels.enrolled}
        value={fmt(enrolled)}
        hint={share(enrolled)}
      />
    </div>
  );
}
