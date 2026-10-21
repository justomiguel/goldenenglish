import Link from "next/link";
import { UserRound, Users } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import type { UpcomingBirthdayCardRow } from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";
import type { AdminFirstClassChecklist } from "@/lib/dashboard/evaluateAdminFirstClassChecklist";
import { AdminFirstClassChecklistCard } from "@/components/dashboard/AdminFirstClassChecklistCard";
import { AdminHubMetricCard } from "@/components/dashboard/AdminHubMetricCard";
import { UpcomingBirthdaysCard } from "@/components/molecules/UpcomingBirthdaysCard";
import { adminUserRoleOptionLabel } from "@/lib/dashboard/adminUserRoleOptionLabel";

const ROLE_DOT: Record<string, string> = {
  student: "bg-sky-500",
  parent: "bg-emerald-500",
  teacher: "bg-pink-400",
  admin: "bg-amber-500",
  assistant: "bg-violet-400",
};

const metricIcon =
  "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]";

export function AdminHubHomeChecklistSlot({
  dict,
  checklist,
}: {
  dict: Dictionary;
  checklist: AdminFirstClassChecklist;
}) {
  return <AdminFirstClassChecklistCard labels={dict.admin.home.firstClassChecklist} checklist={checklist} />;
}

export function AdminHubHomeStudentsSlot({
  base,
  dict,
  count,
}: {
  base: string;
  dict: Dictionary;
  count: number;
}) {
  const t = dict.admin.home.summary.studentsWithoutSection;
  const label = t.linkAria.replace("{{count}}", String(count));
  return (
    <Link
      href={`${base}/students`}
      data-tour="admin-hub-students-without-section"
      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-[var(--color-foreground)] transition hover:bg-amber-100/80"
      aria-label={label}
      title={label}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
        <UserRound className="h-5 w-5" aria-hidden />
      </span>
      <span>
        <span className="font-semibold text-[var(--color-primary)]">
          {t.lead.replace("{{count}}", String(count))}
        </span>{" "}
        <span className="font-medium text-[var(--color-primary)]">{t.cta} →</span>
      </span>
    </Link>
  );
}

export function AdminHubHomePeopleCard({
  base,
  dict,
  summary,
}: {
  base: string;
  dict: Dictionary;
  summary: AdminHubSummary;
}) {
  const t = dict.admin.home.summary;
  return (
    <AdminHubMetricCard
      href={`${base}/students`}
      tourAnchor="admin-hub-users"
      icon={<Users className="h-6 w-6" />}
      title={t.users.title}
      accentClass={metricIcon}
      hint={t.users.cardTip}
      className="shrink-0 p-4"
    >
      <p className="text-4xl font-bold tracking-tight text-[var(--color-foreground)]">{summary.users.total}</p>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t.users.total}</p>
      <ul className="mt-2 divide-y divide-[var(--color-border)]/70">
        {summary.users.byRole.slice(0, 4).map((row) => (
          <li key={row.role} className="flex items-center justify-between py-1.5 text-sm first:pt-0 last:pb-0">
            <span className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
              <span className={`h-2.5 w-2.5 rounded-full ${ROLE_DOT[row.role] ?? "bg-[var(--color-primary)]"}`} aria-hidden />
              {adminUserRoleOptionLabel(dict.admin.users, row.role)}
            </span>
            <span className="font-semibold text-[var(--color-foreground)]">{row.count}</span>
          </li>
        ))}
      </ul>
    </AdminHubMetricCard>
  );
}

export function AdminHubHomeBirthdaysSlot({
  locale,
  rows,
  dict,
}: {
  locale: string;
  rows: UpcomingBirthdayCardRow[];
  dict: Dictionary["dashboard"]["birthdays"];
}) {
  return (
    <div data-tour="admin-hub-birthdays">
      <UpcomingBirthdaysCard locale={locale} rows={rows} dict={dict} />
    </div>
  );
}
