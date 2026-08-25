import type { CSSProperties, ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { WorkplaceNavGroup } from "@/lib/dashboard/workplaceNav";
import { AdminSidebarProfileFooter } from "@/components/dashboard/AdminSidebarProfileFooter";
import { StaffDrawerSignOut } from "@/components/dashboard/StaffDrawerSignOut";
import { StaffSidebarBrand } from "@/components/dashboard/StaffSidebarBrand";
import { WorkplaceMobileDrawer } from "@/components/dashboard/WorkplaceMobileDrawer";
import { WorkplaceNavList } from "@/components/dashboard/WorkplaceNavList";

export function WorkplaceShell({
  locale,
  dict,
  brand,
  homeHref,
  roleBadge,
  navAria,
  mobileOpen,
  mobileClose,
  backToSite,
  signOutTitle,
  headerAria,
  headerTourId,
  desktopNavTourId,
  mobileNavTourId,
  navGroups,
  profileDisplayName,
  profileRoleLabel,
  profileAvatarUrl,
  headerExtras,
  workspaceSwitch,
  hideSignOut = false,
  viewAsBanner,
  children,
}: {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  homeHref: string;
  roleBadge: string;
  navAria: string;
  mobileOpen: string;
  mobileClose: string;
  backToSite: string;
  signOutTitle: string;
  headerAria: string;
  headerTourId?: string;
  desktopNavTourId?: string;
  mobileNavTourId?: string;
  navGroups: WorkplaceNavGroup[];
  profileDisplayName: string;
  profileRoleLabel: string;
  profileAvatarUrl: string | null;
  headerExtras?: ReactNode;
  workspaceSwitch?: ReactNode;
  hideSignOut?: boolean;
  viewAsBanner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="flex h-dvh max-h-dvh overflow-hidden bg-[var(--color-muted)]"
      style={{ "--portal-header-offset": "4.25rem" } as CSSProperties}
    >
      <aside className="hidden h-full w-72 shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] md:flex">
        <StaffSidebarBrand href={homeHref} brand={brand} locale={locale} />
        <AdminSidebarProfileFooter
          locale={locale}
          dict={dict}
          displayName={profileDisplayName}
          roleLabel={profileRoleLabel}
          avatarUrl={profileAvatarUrl}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <WorkplaceNavList
            groups={navGroups}
            ariaLabel={navAria}
            tourId={desktopNavTourId}
          />
        </div>
        {hideSignOut ? null : (
          <StaffDrawerSignOut locale={locale} label={dict.nav.logout} title={signOutTitle} />
        )}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header
          {...(headerTourId ? { "data-tour": headerTourId } : {})}
          aria-label={headerAria}
          className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-soft)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <WorkplaceMobileDrawer
                locale={locale}
                dict={dict}
                brand={brand}
                homeHref={homeHref}
                roleBadge={roleBadge}
                navAria={navAria}
                mobileOpen={mobileOpen}
                mobileClose={mobileClose}
                backToSite={backToSite}
                signOutTitle={signOutTitle}
                navGroups={navGroups}
                navTourId={mobileNavTourId}
                profileDisplayName={profileDisplayName}
                profileRoleLabel={profileRoleLabel}
                profileAvatarUrl={profileAvatarUrl}
                hideSignOut={hideSignOut}
              />
              <p className="truncate text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {roleBadge}
              </p>
              {workspaceSwitch}
            </div>
            {headerExtras}
          </div>
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 py-5 md:px-8 md:py-5">
          {viewAsBanner ? <div className="mb-4">{viewAsBanner}</div> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
