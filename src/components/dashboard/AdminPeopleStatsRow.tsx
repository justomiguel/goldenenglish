import { GraduationCap, Phone, Sparkle, Users } from "lucide-react";
import { AdminStatCard } from "@/components/dashboard/AdminStatCard";
import { peopleSharePercent } from "@/lib/dashboard/loadAdminPeoplePageStats";
import type { Dictionary } from "@/types/i18n";

export function AdminPeopleStatsRow({
  locale,
  labels,
  totalLabel,
  roleLabel,
  total,
  allAccounts,
  withPhone,
  newLast30Days,
}: {
  locale: string;
  labels: Dictionary["admin"]["home"]["peopleStats"];
  totalLabel: string;
  roleLabel: string;
  iconId?: string;
  total: number;
  allAccounts: number;
  withPhone: number;
  newLast30Days: number;
}) {
  const share = peopleSharePercent(total, allAccounts);
  const phoneShare = peopleSharePercent(withPhone, total);
  const fmt = (n: number) => n.toLocaleString(locale);
  const ic = "h-5 w-5";

  return (
    <div className="relative z-0 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatCard
        icon={<Users className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-sky-100 text-sky-700"
        label={totalLabel}
        value={fmt(total)}
        hint={labels.activeInInstitute}
      />
      <AdminStatCard
        icon={<GraduationCap className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-emerald-100 text-emerald-700"
        label={roleLabel}
        value={fmt(total)}
        hint={labels.shareOfTotal.replace("{{pct}}", share.toLocaleString(locale, { maximumFractionDigits: 1 }))}
      />
      <AdminStatCard
        icon={<Phone className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-amber-100 text-amber-700"
        label={labels.withPhone}
        value={fmt(withPhone)}
        hint={labels.shareOfTotal.replace("{{pct}}", phoneShare.toLocaleString(locale, { maximumFractionDigits: 1 }))}
      />
      <AdminStatCard
        icon={<Sparkle className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-violet-100 text-violet-700"
        label={labels.newThisMonth}
        value={fmt(newLast30Days)}
        hint={labels.last30Days}
      />
    </div>
  );
}
