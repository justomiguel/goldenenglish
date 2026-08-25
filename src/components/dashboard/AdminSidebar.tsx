import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { AdminSidebarNavContent } from "@/components/dashboard/AdminSidebarNavContent";
import { AdminSidebarProfileFooter } from "@/components/dashboard/AdminSidebarProfileFooter";
import { StaffDrawerSignOut } from "@/components/dashboard/StaffDrawerSignOut";
import { StaffSidebarBrand } from "@/components/dashboard/StaffSidebarBrand";

export interface AdminSidebarProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminNav"];
  fullDict: Dictionary;
  brand: BrandPublic;
  newRegistrationsCount: number;
  recentInboundMessagesCount: number;
  includeEmailTemplatesNav?: boolean;
  includeBlogNav?: boolean;
  profileDisplayName: string;
  profileRoleLabel: string;
  profileAvatarUrl: string | null;
}

export function AdminSidebar({
  locale,
  dict,
  brand,
  newRegistrationsCount,
  recentInboundMessagesCount,
  includeEmailTemplatesNav,
  includeBlogNav,
  fullDict,
  profileDisplayName,
  profileRoleLabel,
  profileAvatarUrl,
}: AdminSidebarProps) {
  return (
    <aside
      data-tour="admin-sidebar"
      className="hidden h-full w-72 shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] md:flex"
    >
      <StaffSidebarBrand href={`/${locale}/dashboard/admin`} brand={brand} locale={locale} />
      <AdminSidebarProfileFooter
        locale={locale}
        dict={fullDict}
        displayName={profileDisplayName}
        roleLabel={profileRoleLabel}
        avatarUrl={profileAvatarUrl}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <AdminSidebarNavContent
          locale={locale}
          dict={dict}
          newRegistrationsCount={newRegistrationsCount}
          recentInboundMessagesCount={recentInboundMessagesCount}
          includeEmailTemplatesNav={includeEmailTemplatesNav}
          includeBlogNav={includeBlogNav}
          tone="light"
        />
      </div>
      <StaffDrawerSignOut
        locale={locale}
        label={fullDict.nav.logout}
        title={fullDict.dashboard.adminChrome.signOutHint}
      />
    </aside>
  );
}
