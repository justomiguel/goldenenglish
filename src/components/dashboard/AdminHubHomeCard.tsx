import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import type { UpcomingBirthdayCardRow } from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";
import type { AdminFirstClassChecklist } from "@/lib/dashboard/evaluateAdminFirstClassChecklist";
import type { AdminHomeExtraWidgets } from "@/lib/dashboard/loadAdminHomeExtraWidgets";
import type { AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";
import { AdminHubHomeTrafficCard } from "@/components/dashboard/AdminHubHomeTrafficCard";
import {
  AdminHubHomeMessagesSlot,
  AdminHubHomePaymentsCard,
  AdminHubHomeRegistrationsCard,
} from "@/components/dashboard/AdminHubHomeWorkCards";
import {
  AdminHubHomeBirthdaysSlot,
  AdminHubHomeChecklistSlot,
  AdminHubHomePeopleCard,
  AdminHubHomeStudentsSlot,
} from "@/components/dashboard/AdminHubHomePeopleCards";
import {
  AdminHubHomeChangelogCard,
  AdminHubHomeCollectionsCard,
  AdminHubHomeEventsCard,
  AdminHubHomePeoplePulseCard,
  AdminHubHomeShopCard,
  AdminHubHomeShortcutsSlot,
} from "@/components/dashboard/AdminHubHomeExtraCards";

export interface AdminHubHomeCardModel {
  locale: string;
  base: string;
  dict: Dictionary;
  summary: AdminHubSummary;
  birthdayRows: UpcomingBirthdayCardRow[];
  birthdaysDict: Dictionary["dashboard"]["birthdays"];
  includeBlog: boolean;
  checklist: AdminFirstClassChecklist | null;
  extras: AdminHomeExtraWidgets;
}

export function AdminHubHomeCard({ id, model }: { id: AdminHomeWidgetId; model: AdminHubHomeCardModel }): ReactNode {
  const { locale, base, dict, summary, extras } = model;
  switch (id) {
    case "checklist":
      return model.checklist ? <AdminHubHomeChecklistSlot dict={dict} checklist={model.checklist} /> : null;
    case "studentsWithoutSection":
      return <AdminHubHomeStudentsSlot base={base} dict={dict} count={summary.studentsWithoutSection} />;
    case "payments":
      return <AdminHubHomePaymentsCard base={base} dict={dict} summary={summary} />;
    case "registrations":
      return <AdminHubHomeRegistrationsCard base={base} dict={dict} summary={summary} />;
    case "messages":
      return <AdminHubHomeMessagesSlot locale={locale} base={base} dict={dict} summary={summary} />;
    case "people":
      return <AdminHubHomePeopleCard base={base} dict={dict} summary={summary} />;
    case "birthdays":
      return <AdminHubHomeBirthdaysSlot locale={locale} rows={model.birthdayRows} dict={model.birthdaysDict} />;
    case "peoplePulse":
      return (
        <AdminHubHomePeoplePulseCard base={base} dict={dict} pulse={extras.peoplePulse} />
      );
    case "collections":
      return <AdminHubHomeCollectionsCard locale={locale} base={base} dict={dict} collections={extras.collections} />;
    case "upcomingEvents":
      return <AdminHubHomeEventsCard locale={locale} base={base} dict={dict} events={extras.upcomingEvents} />;
    case "traffic":
      return <AdminHubHomeTrafficCard locale={locale} base={base} dict={dict} summary={summary} />;
    case "shopOrders":
      return <AdminHubHomeShopCard base={base} dict={dict} openCount={extras.shopOpenCount} />;
    case "changelog":
      return <AdminHubHomeChangelogCard dict={dict} entries={extras.changelog} />;
    case "shortcuts":
      return <AdminHubHomeShortcutsSlot base={base} dict={dict} includeBlog={model.includeBlog} />;
    default: {
      const never: never = id;
      return never;
    }
  }
}
