import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Minus,
  Wallet,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import type { UpcomingBirthdayCardRow } from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";
import { AdminHubMetricCard } from "@/components/dashboard/AdminHubMetricCard";
import { AdminHubMessagesCard } from "@/components/dashboard/AdminHubMessagesCard";
import { AdminHubTrafficChart } from "@/components/dashboard/AdminHubTrafficChart";
import { AdminHubHomePeopleColumn } from "@/components/dashboard/AdminHubHomePeopleColumn";
import { trafficVisitsSeries } from "@/lib/dashboard/mapAdminTrafficDailyStacked";

const metricIcon =
  "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]";

export function AdminHubHomeOpsGrid({
  locale,
  base,
  dict,
  summary,
  birthdayRows,
  birthdaysDict,
}: {
  locale: string;
  base: string;
  dict: Dictionary;
  summary: AdminHubSummary;
  birthdayRows: UpcomingBirthdayCardRow[];
  birthdaysDict: Dictionary["dashboard"]["birthdays"];
}) {
  const t = dict.admin.home.summary;
  const weekDelta =
    summary.trafficWeekOverWeek.lastWeek > 0
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
    <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-12">
      <div className="flex flex-col gap-5 lg:col-span-8 lg:min-h-0">
        <AdminHubMetricCard
          href={`${base}/analytics`}
          tourAnchor="admin-hub-traffic"
          icon={<Activity className="h-6 w-6" />}
          title={t.traffic.title}
          accentClass={metricIcon}
          hint={t.traffic.cardTip}
          rangeLabel={t.traffic.hits30d}
          className="p-6"
        >
          <div className="space-y-4">
            <AdminHubTrafficChart
              series={trafficVisitsSeries(summary.trafficDaily)}
              visitsLabel={t.traffic.hits30d}
              locale={locale}
            />
            <div>
              <p className="text-4xl font-bold tracking-tight text-[var(--color-foreground)]">
                {summary.traffic.totalHits.toLocaleString()}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-[var(--color-muted-foreground)]">
                <span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {summary.traffic.authenticatedHits.toLocaleString()}
                  </span>{" "}
                  {t.traffic.authenticated}
                </span>
                <span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {summary.traffic.guestHits.toLocaleString()}
                  </span>{" "}
                  {t.traffic.guests}
                </span>
              </div>
              <div className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span>
                  {trendLabel} {t.traffic.weekTrend}
                </span>
              </div>
            </div>
          </div>
        </AdminHubMetricCard>

        <div className="grid shrink-0 grid-cols-1 items-start gap-5 lg:grid-cols-3">
          <AdminHubMetricCard
            href={`${base}/payments`}
            tourAnchor="admin-hub-payments"
            icon={<Wallet className="h-6 w-6" />}
            title={t.payments.title}
            hint={t.payments.cardTip}
            accentClass={
              summary.payments.pendingCount > 0
                ? "bg-amber-50 text-amber-600"
                : "bg-emerald-50 text-emerald-600"
            }
            linkLabel={t.payments.viewAll}
            urgent={summary.payments.pendingCount > 0}
            illustration={
              <CreditCard
                className={`h-14 w-14 ${
                  summary.payments.pendingCount > 0 ? "text-amber-300" : "text-emerald-300"
                }`}
                strokeWidth={1.15}
              />
            }
          >
            {summary.payments.pendingCount > 0 ? (
              <>
                <p className="text-4xl font-bold text-amber-600">{summary.payments.pendingCount}</p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t.payments.pending}</p>
              </>
            ) : (
              <p className="text-sm font-medium text-emerald-600">{t.payments.noPending}</p>
            )}
          </AdminHubMetricCard>

          <AdminHubMetricCard
            href={`${base}/registrations`}
            tourAnchor="admin-hub-registrations"
            icon={<ClipboardList className="h-6 w-6" />}
            title={t.registrations.title}
            hint={t.registrations.cardTip}
            accentClass={
              summary.registrations.newCount > 0
                ? "bg-orange-50 text-orange-600"
                : "bg-emerald-50 text-emerald-600"
            }
            linkLabel={t.registrations.viewAll}
            urgent={summary.registrations.newCount > 0}
            illustration={
              <ClipboardCheck
                className={`h-14 w-14 ${
                  summary.registrations.newCount > 0 ? "text-orange-300" : "text-emerald-300"
                }`}
                strokeWidth={1.15}
              />
            }
          >
            {summary.registrations.newCount > 0 ? (
              <>
                <p className="text-4xl font-bold text-orange-600">{summary.registrations.newCount}</p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  {t.registrations.newCount}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  {t.registrations.total}: {summary.registrations.totalCount}
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl font-bold text-[var(--color-foreground)]">
                  {summary.registrations.totalCount}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t.registrations.total}</p>
                <p className="mt-1 text-sm font-medium text-emerald-600">{t.registrations.noNew}</p>
              </>
            )}
          </AdminHubMetricCard>

          <AdminHubMessagesCard
            href={`${base}/messages`}
            tourAnchor="admin-hub-messages"
            labels={t.messages}
            cardTip={t.messages.cardTip}
            recentCount={summary.messages.recentCount}
            latestPreview={summary.messages.latestPreview}
            locale={locale}
          />
        </div>
      </div>

      <AdminHubHomePeopleColumn
        locale={locale}
        base={base}
        dict={dict}
        summary={summary}
        birthdayRows={birthdayRows}
        birthdaysDict={birthdaysDict}
      />
    </div>
  );
}
