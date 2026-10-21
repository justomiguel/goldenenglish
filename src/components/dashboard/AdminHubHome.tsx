import type { Dictionary } from "@/types/i18n";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import type { UpcomingBirthdayCardRow } from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";
import type { AdminFirstClassChecklist } from "@/lib/dashboard/evaluateAdminFirstClassChecklist";
import { AdminHubHomeBoard } from "@/components/dashboard/AdminHubHomeBoard";
import { factoryAdminHomeLayout, type AdminHomeLayout } from "@/lib/dashboard/adminHomeLayout";
import type { AdminHomeExtraWidgets } from "@/lib/dashboard/loadAdminHomeExtraWidgets";

const EMPTY_EXTRAS: AdminHomeExtraWidgets = {
  peoplePulse: null,
  collections: null,
  upcomingEvents: [],
  shopOpenCount: null,
  changelog: [],
  hasCurrentCohort: false,
};

interface AdminHubHomeProps {
  locale: string;
  dict: Dictionary;
  summary: AdminHubSummary;
  birthdayRows: UpcomingBirthdayCardRow[];
  birthdaysDict: Dictionary["dashboard"]["birthdays"];
  greetingName?: string;
  includeBlog?: boolean;
  checklist?: AdminFirstClassChecklist | null;
  layout?: AdminHomeLayout;
  shopEnabled?: boolean;
  extras?: AdminHomeExtraWidgets;
}

export function AdminHubHome({
  locale,
  dict,
  summary,
  birthdayRows,
  birthdaysDict,
  greetingName,
  includeBlog = false,
  checklist = null,
  layout,
  shopEnabled = false,
  extras = EMPTY_EXTRAS,
}: AdminHubHomeProps) {
  const base = `/${locale}/dashboard/admin`;
  const resolvedLayout = layout ?? factoryAdminHomeLayout({ shopEnabled });

  return (
    <div className="flex flex-col gap-5 lg:flex-1">
      <div data-tour="admin-hub-title" className="shrink-0">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-primary)] md:text-[2.5rem]">
          {greetingName
            ? dict.admin.home.greetingNamed.replace("{{name}}", greetingName)
            : dict.admin.home.greeting}{" "}
          <span aria-hidden>👋</span>
        </h1>
        <p className="mt-2 text-base text-[var(--color-muted-foreground)]">{dict.admin.home.lead}</p>
      </div>
      <AdminHubHomeBoard
        layout={resolvedLayout}
        shopEnabled={shopEnabled}
        model={{
          locale,
          base,
          dict,
          summary,
          birthdayRows,
          birthdaysDict,
          includeBlog,
          checklist,
          extras,
        }}
      />
    </div>
  );
}
