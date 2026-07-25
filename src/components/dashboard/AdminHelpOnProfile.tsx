import { AdminHelpLauncher } from "@/components/dashboard/AdminHelpLauncher";
import type { Dictionary } from "@/types/i18n";

export interface AdminHelpOnProfileProps {
  locale: string;
  dict: Dictionary;
}

/** Help FAB on /dashboard/profile for admin sessions (content-only profile explain tour). */
export function AdminHelpOnProfile({ locale, dict }: AdminHelpOnProfileProps) {
  return (
    <AdminHelpLauncher
      locale={locale}
      launcherDict={dict.dashboard.adminHelpLauncher}
      catalogDict={dict.dashboard.adminHelpCatalog}
      catalogGroupsDict={dict.dashboard.adminHelpCatalogGroups}
      toursDict={dict.dashboard.adminHelpTours}
      explainScreenDict={dict.dashboard.adminHelpExplainScreen}
      screenToursDict={dict.dashboard.adminHelpScreenTours}
    />
  );
}
