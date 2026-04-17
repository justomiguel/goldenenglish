import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Users,
  Wallet,
  ClipboardList,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import { AdminHubMetricCard } from "@/components/dashboard/AdminHubMetricCard";
import { AdminHubMessagesCard } from "@/components/dashboard/AdminHubMessagesCard";

interface AdminHubHomeProps {
  locale: string;
  dict: Dictionary;
  summary: AdminHubSummary;
}

export function AdminHubHome({ locale, dict, summary }: AdminHubHomeProps) {
  const base = `/${locale}/dashboard/admin`;
  const t = dict.admin.home.summary;
  const studentsNoSectionTitle = t.studentsWithoutSection.linkAria.replace(
    "{{count}}",
    String(summary.studentsWithoutSection),
  );

  const weekDelta = summary.trafficWeekOverWeek.lastWeek > 0
    ? Math.round(
        ((summary.trafficWeekOverWeek.thisWeek - summary.trafficWeekOverWeek.lastWeek) /
          summary.trafficWeekOverWeek.lastWeek) *
          100,
      )
    : 0;

  const trendLabel =
    weekDelta > 0
      ? `${weekDelta}% ${t.traffic.up}`
      : weekDelta < 0
        ? `${Math.abs(weekDelta)}% ${t.traffic.down}`
        : t.traffic.flat;

  const TrendIcon = weekDelta > 0 ? ArrowUpRight : weekDelta < 0 ? ArrowDownRight : Minus;
  const trendColor =
    weekDelta > 0
      ? "text-emerald-600"
      : weekDelta < 0
        ? "text-rose-500"
        : "text-[var(--color-muted-foreground)]";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.home.title}
      </h1>
      <p className="mt-1 text-[var(--color-muted-foreground)]">
        {dict.admin.home.lead}
      </p>

      {summary.studentsWithoutSection > 0 ? (
        <Link
          href={`${base}/users`}
          className="mt-4 block rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-accent)]/16"
          aria-label={studentsNoSectionTitle}
          title={studentsNoSectionTitle}
        >
          <span className="font-semibold text-[var(--color-secondary)]">
            {t.studentsWithoutSection.lead.replace(
              "{{count}}",
              String(summary.studentsWithoutSection),
            )}
          </span>{" "}
          <span className="text-[var(--color-primary)] underline underline-offset-2">
            {t.studentsWithoutSection.cta}
          </span>
        </Link>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminHubMetricCard
          href={`${base}/analytics`}
          icon={<Activity className="h-5 w-5" />}
          title={t.traffic.title}
          accentClass="bg-indigo-50 text-indigo-600"
          hint={t.traffic.cardTip}
        >
          <p className="text-3xl font-bold text-[var(--color-foreground)]">
            {summary.traffic.totalHits.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            {t.traffic.hits30d}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-[var(--color-muted-foreground)]">
              {t.traffic.authenticated}: {summary.traffic.authenticatedHits.toLocaleString()}
            </span>
            <span className="text-[var(--color-muted-foreground)]">
              {t.traffic.guests}: {summary.traffic.guestHits.toLocaleString()}
            </span>
          </div>
          <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{trendLabel}</span>
            <span className="font-normal text-[var(--color-muted-foreground)]">
              {t.traffic.weekTrend}
            </span>
          </div>
        </AdminHubMetricCard>

        <AdminHubMetricCard
          href={`${base}/users`}
          icon={<Users className="h-5 w-5" />}
          title={t.users.title}
          accentClass="bg-sky-50 text-sky-600"
          linkLabel={t.users.viewAll}
          hint={t.users.cardTip}
        >
          <p className="text-3xl font-bold text-[var(--color-foreground)]">
            {summary.users.total}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            {t.users.total}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-muted-foreground)]">
            {summary.users.byRole.slice(0, 4).map((r) => (
              <span key={r.role} className="capitalize">
                {r.role}: {r.count}
              </span>
            ))}
          </div>
        </AdminHubMetricCard>

        <AdminHubMetricCard
          href={`${base}/payments`}
          icon={<Wallet className="h-5 w-5" />}
          title={t.payments.title}
          hint={t.payments.cardTip}
          accentClass={
            summary.payments.pendingCount > 0
              ? "bg-amber-50 text-amber-600"
              : "bg-emerald-50 text-emerald-600"
          }
          linkLabel={t.payments.viewAll}
          urgent={summary.payments.pendingCount > 0}
        >
          {summary.payments.pendingCount > 0 ? (
            <>
              <p className="text-3xl font-bold text-amber-600">
                {summary.payments.pendingCount}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                {t.payments.pending}
              </p>
            </>
          ) : (
            <p className="text-sm text-emerald-600">{t.payments.noPending}</p>
          )}
        </AdminHubMetricCard>

        <AdminHubMetricCard
          href={`${base}/registrations`}
          icon={<ClipboardList className="h-5 w-5" />}
          title={t.registrations.title}
          hint={t.registrations.cardTip}
          accentClass={
            summary.registrations.newCount > 0
              ? "bg-orange-50 text-orange-600"
              : "bg-emerald-50 text-emerald-600"
          }
          linkLabel={t.registrations.viewAll}
          urgent={summary.registrations.newCount > 0}
        >
          {summary.registrations.newCount > 0 ? (
            <>
              <p className="text-3xl font-bold text-orange-600">
                {summary.registrations.newCount}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                {t.registrations.newCount}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {t.registrations.total}: {summary.registrations.totalCount}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-emerald-600">{t.registrations.noNew}</p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {t.registrations.total}: {summary.registrations.totalCount}
              </p>
            </>
          )}
        </AdminHubMetricCard>

        <AdminHubMessagesCard
          href={`${base}/messages`}
          labels={t.messages}
          cardTip={t.messages.cardTip}
          recentCount={summary.messages.recentCount}
          latestPreview={summary.messages.latestPreview}
          locale={locale}
        />
      </div>
    </div>
  );
}
