import type { Dictionary } from "@/types/i18n";
import type { AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";

export function adminHomeCardLabel(id: AdminHomeWidgetId, dict: Dictionary): string {
  const widgets = dict.admin.home.layout.widgets;
  const summary = dict.admin.home.summary;
  switch (id) {
    case "checklist":
      return widgets.checklist;
    case "studentsWithoutSection":
      return widgets.studentsWithoutSection;
    case "payments":
      return summary.payments.title;
    case "registrations":
      return summary.registrations.title;
    case "messages":
      return summary.messages.title;
    case "people":
      return summary.users.title;
    case "birthdays":
      return dict.dashboard.birthdays.cardTitle;
    case "peoplePulse":
      return widgets.peoplePulseTitle;
    case "collections":
      return widgets.collectionsTitle;
    case "upcomingEvents":
      return widgets.eventsTitle;
    case "traffic":
      return summary.traffic.title;
    case "shopOrders":
      return widgets.shopTitle;
    case "changelog":
      return widgets.changelogTitle;
    case "shortcuts":
      return dict.admin.home.boost.title;
    default: {
      const never: never = id;
      return never;
    }
  }
}

export function adminHomeCardAbout(id: AdminHomeWidgetId, dict: Dictionary): string {
  const about = dict.admin.home.layout.widgets.about;
  switch (id) {
    case "checklist":
      return about.checklist;
    case "studentsWithoutSection":
      return about.studentsWithoutSection;
    case "payments":
      return about.payments;
    case "registrations":
      return about.registrations;
    case "messages":
      return about.messages;
    case "people":
      return about.people;
    case "birthdays":
      return about.birthdays;
    case "peoplePulse":
      return about.peoplePulse;
    case "collections":
      return about.collections;
    case "upcomingEvents":
      return about.upcomingEvents;
    case "traffic":
      return about.traffic;
    case "shopOrders":
      return about.shopOrders;
    case "changelog":
      return about.changelog;
    case "shortcuts":
      return about.shortcuts;
    default: {
      const never: never = id;
      return never;
    }
  }
}
