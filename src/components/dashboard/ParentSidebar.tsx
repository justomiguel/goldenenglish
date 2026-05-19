import type { Dictionary } from "@/types/i18n";
import { ParentSidebarNavContent } from "@/components/dashboard/ParentSidebarNavContent";

export interface ParentSidebarProps {
  locale: string;
  dict: Dictionary["dashboard"]["parentNav"];
  baseHref?: string;
  profileHref?: string;
}

export function ParentSidebar({ locale, dict, baseHref, profileHref }: ParentSidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 md:block md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-surface)] md:py-5 md:pl-2 md:pr-2 md:shadow-sm">
      <ParentSidebarNavContent
        locale={locale}
        dict={dict}
        baseHref={baseHref}
        profileHref={profileHref}
      />
    </aside>
  );
}
