import { CalendarDays, Hourglass, Ticket } from "lucide-react";
import { AdminStatCard } from "@/components/dashboard/AdminStatCard";
import { peopleSharePercent } from "@/lib/dashboard/loadAdminPeoplePageStats";

export function AdminEventsStatsRow({
  locale,
  totalLabel,
  totalHint,
  upcomingLabel,
  waitlistLabel,
  shareOfTotal,
  total,
  upcoming,
  waitlist,
}: {
  locale: string;
  totalLabel: string;
  totalHint: string;
  upcomingLabel: string;
  waitlistLabel: string;
  shareOfTotal: string;
  total: number;
  upcoming: number;
  waitlist: number;
}) {
  const fmt = (n: number) => n.toLocaleString(locale);
  const ic = "h-5 w-5";
  const share = (part: number) =>
    shareOfTotal.replace(
      "{{pct}}",
      peopleSharePercent(part, total).toLocaleString(locale, { maximumFractionDigits: 1 }),
    );
  return (
    <div className="relative z-0 mt-6 grid gap-3 sm:grid-cols-3">
      <AdminStatCard
        icon={<CalendarDays className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-sky-100 text-sky-700"
        label={totalLabel}
        value={fmt(total)}
        hint={totalHint}
      />
      <AdminStatCard
        icon={<Hourglass className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-amber-100 text-amber-700"
        label={upcomingLabel}
        value={fmt(upcoming)}
        hint={share(upcoming)}
      />
      <AdminStatCard
        icon={<Ticket className={ic} strokeWidth={1.5} aria-hidden />}
        iconClass="bg-violet-100 text-violet-700"
        label={waitlistLabel}
        value={fmt(waitlist)}
        hint={share(waitlist)}
      />
    </div>
  );
}
