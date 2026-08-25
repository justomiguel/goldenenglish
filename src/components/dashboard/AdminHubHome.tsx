import Link from "next/link";
import { UserRound } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import type { UpcomingBirthdayCardRow } from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";
import { AdminHubHomeBoost } from "@/components/dashboard/AdminHubHomeBoost";
import { AdminHubHomeOpsGrid } from "@/components/dashboard/AdminHubHomeOpsGrid";
import { AdminFirstClassChecklistCard } from "@/components/dashboard/AdminFirstClassChecklistCard";
import type { AdminFirstClassChecklist } from "@/lib/dashboard/evaluateAdminFirstClassChecklist";

interface AdminHubHomeProps {
  locale: string;
  dict: Dictionary;
  summary: AdminHubSummary;
  birthdayRows: UpcomingBirthdayCardRow[];
  birthdaysDict: Dictionary["dashboard"]["birthdays"];
  greetingName?: string;
  includeBlog?: boolean;
  checklist?: AdminFirstClassChecklist | null;
}

export function AdminHubHome({
  locale,
  dict,
  summary,
  birthdayRows,
  birthdaysDict,
  greetingName,
  includeBlog = false,
  checklist,
}: AdminHubHomeProps) {
  const base = `/${locale}/dashboard/admin`;
  const t = dict.admin.home.summary;
  const studentsNoSectionTitle = t.studentsWithoutSection.linkAria.replace(
    "{{count}}",
    String(summary.studentsWithoutSection),
  );

  return (
    <div className="flex flex-col gap-5 lg:min-h-0 lg:flex-1">
      <div data-tour="admin-hub-title" className="shrink-0">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-primary)] md:text-[2.5rem]">
          {greetingName
            ? dict.admin.home.greetingNamed.replace("{{name}}", greetingName)
            : dict.admin.home.greeting}{" "}
          <span aria-hidden>👋</span>
        </h1>
        <p className="mt-2 text-base text-[var(--color-muted-foreground)]">{dict.admin.home.lead}</p>
      </div>

      {checklist && !checklist.allDone ? (
        <AdminFirstClassChecklistCard
          labels={dict.admin.home.firstClassChecklist}
          checklist={checklist}
        />
      ) : null}

      {summary.studentsWithoutSection > 0 ? (
        <Link
          href={`${base}/students`}
          data-tour="admin-hub-students-without-section"
          className="flex shrink-0 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-[var(--color-foreground)] transition hover:bg-amber-100/80"
          aria-label={studentsNoSectionTitle}
          title={studentsNoSectionTitle}
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <UserRound className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="font-semibold text-[var(--color-primary)]">
              {t.studentsWithoutSection.lead.replace(
                "{{count}}",
                String(summary.studentsWithoutSection),
              )}
            </span>{" "}
            <span className="font-medium text-[var(--color-primary)]">
              {t.studentsWithoutSection.cta} →
            </span>
          </span>
        </Link>
      ) : null}

      <AdminHubHomeOpsGrid
        locale={locale}
        base={base}
        dict={dict}
        summary={summary}
        birthdayRows={birthdayRows}
        birthdaysDict={birthdaysDict}
      />

      <AdminHubHomeBoost base={base} dict={dict} includeBlog={includeBlog} />
    </div>
  );
}
