import type { Dictionary } from "@/types/i18n";
import { ParentSidebarNavContent } from "@/components/dashboard/ParentSidebarNavContent";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

export interface ParentSidebarProps {
  locale: string;
  dict: Dictionary["dashboard"]["parentNav"];
  baseHref?: string;
  profileHref?: string;
  includePayments?: boolean;
}

export function ParentSidebar({ locale, dict, baseHref, profileHref, includePayments }: ParentSidebarProps) {
  return (
    <aside
      data-tour={PARENT_TOUR_ANCHORS.sidebar}
      className="hidden w-56 shrink-0 md:block md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-surface)] md:py-5 md:pl-2 md:pr-2 md:shadow-sm"
    >
      <ParentSidebarNavContent
        locale={locale}
        dict={dict}
        baseHref={baseHref}
        profileHref={profileHref}
        includePayments={includePayments}
      />
    </aside>
  );
}
