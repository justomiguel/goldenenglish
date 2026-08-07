import type { Dictionary } from "@/types/i18n";
import { AdminSidebarNavContent } from "@/components/dashboard/AdminSidebarNavContent";

export interface AdminSidebarProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminNav"];
  newRegistrationsCount: number;
  recentInboundMessagesCount: number;
  includeEmailTemplatesNav?: boolean;
  includeBlogNav?: boolean;
}

export function AdminSidebar({
  locale,
  dict,
  newRegistrationsCount,
  recentInboundMessagesCount,
  includeEmailTemplatesNav,
  includeBlogNav,
}: AdminSidebarProps) {
  return (
    <aside
      data-tour="admin-sidebar"
      className="hidden w-56 shrink-0 md:block md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-surface)] md:py-5 md:pl-2 md:pr-2 md:shadow-sm"
    >
      <AdminSidebarNavContent
        locale={locale}
        dict={dict}
        newRegistrationsCount={newRegistrationsCount}
        recentInboundMessagesCount={recentInboundMessagesCount}
        includeEmailTemplatesNav={includeEmailTemplatesNav}
        includeBlogNav={includeBlogNav}
      />
    </aside>
  );
}
