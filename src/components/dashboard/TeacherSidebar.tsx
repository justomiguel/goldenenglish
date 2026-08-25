import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { StaffSidebarBrand } from "@/components/dashboard/StaffSidebarBrand";
import {
  TeacherSidebarNavContent,
  type AdminWorkspaceNavLabels,
} from "@/components/dashboard/TeacherSidebarNavContent";
import { AdminSidebarProfileFooter } from "@/components/dashboard/AdminSidebarProfileFooter";
import { StaffDrawerSignOut } from "@/components/dashboard/StaffDrawerSignOut";

export type { AdminWorkspaceNavLabels } from "@/components/dashboard/TeacherSidebarNavContent";

export interface TeacherSidebarProps {
  locale: string;
  dict: Dictionary["dashboard"]["teacherNav"];
  fullDict: Dictionary;
  brand: BrandPublic;
  adminNav?: AdminWorkspaceNavLabels;
  includeBlogNav?: boolean;
  profileDisplayName: string;
  profileRoleLabel: string;
  profileAvatarUrl: string | null;
  hideSignOut?: boolean;
}

export function TeacherSidebar({
  locale,
  dict,
  fullDict,
  brand,
  adminNav,
  includeBlogNav,
  profileDisplayName,
  profileRoleLabel,
  profileAvatarUrl,
  hideSignOut = false,
}: TeacherSidebarProps) {
  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] md:flex">
      <StaffSidebarBrand href={`/${locale}/dashboard/teacher`} brand={brand} locale={locale} />
      <AdminSidebarProfileFooter
        locale={locale}
        dict={fullDict}
        displayName={profileDisplayName}
        roleLabel={profileRoleLabel}
        avatarUrl={profileAvatarUrl}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <TeacherSidebarNavContent
          locale={locale}
          dict={dict}
          adminNav={adminNav}
          includeBlogNav={includeBlogNav}
          tone="light"
        />
      </div>
      {hideSignOut ? null : (
      <StaffDrawerSignOut
        locale={locale}
        label={fullDict.nav.logout}
        title={fullDict.dashboard.adminChrome.signOutHint}
      />
      )}
    </aside>
  );
}
