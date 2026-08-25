import { Users } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import type { UpcomingBirthdayCardRow } from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";
import { UpcomingBirthdaysCard } from "@/components/molecules/UpcomingBirthdaysCard";
import { AdminHubMetricCard } from "@/components/dashboard/AdminHubMetricCard";
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

export function AdminHubHomePeopleColumn({
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
  return (
    <div className="flex flex-col gap-5 lg:col-span-4 lg:min-h-0">
      <AdminHubMetricCard
        href={`${base}/students`}
        tourAnchor="admin-hub-users"
        icon={<Users className="h-6 w-6" />}
        title={t.users.title}
        accentClass={metricIcon}
        hint={t.users.cardTip}
        className="shrink-0 p-4"
      >
        <p className="text-4xl font-bold tracking-tight text-[var(--color-foreground)]">
          {summary.users.total}
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t.users.total}</p>
        <ul className="mt-2 divide-y divide-[var(--color-border)]/70">
          {summary.users.byRole.slice(0, 4).map((r) => (
            <li
              key={r.role}
              className="flex items-center justify-between py-1.5 text-sm first:pt-0 last:pb-0"
            >
              <span className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${ROLE_DOT[r.role] ?? "bg-[var(--color-primary)]"}`}
                  aria-hidden
                />
                {adminUserRoleOptionLabel(dict.admin.users, r.role)}
              </span>
              <span className="font-semibold text-[var(--color-foreground)]">{r.count}</span>
            </li>
          ))}
        </ul>
      </AdminHubMetricCard>

      <div data-tour="admin-hub-birthdays">
        <UpcomingBirthdaysCard
          locale={locale}
          rows={birthdayRows}
          dict={birthdaysDict}
        />
      </div>
    </div>
  );
}
