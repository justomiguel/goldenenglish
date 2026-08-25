"use client";

import { Menu, X } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { AdminSidebarNavContent } from "@/components/dashboard/AdminSidebarNavContent";
import { AdminSidebarProfileFooter } from "@/components/dashboard/AdminSidebarProfileFooter";
import { DashboardMobileDrawerPortal } from "@/components/dashboard/DashboardMobileDrawerPortal";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { StaffSidebarBrand } from "@/components/dashboard/StaffSidebarBrand";
import { useDashboardMobileDrawer } from "@/hooks/useDashboardMobileDrawer";

export interface AdminMobileDrawerProps {
  locale: string;
  dict: Dictionary;
  newRegistrationsCount: number;
  recentInboundMessagesCount: number;
  includeEmailTemplatesNav?: boolean;
  includeBlogNav?: boolean;
  brand?: BrandPublic;
  profileDisplayName?: string;
  profileRoleLabel?: string;
  profileAvatarUrl?: string | null;
}

export function AdminMobileDrawer({
  locale,
  dict,
  newRegistrationsCount,
  recentInboundMessagesCount,
  includeEmailTemplatesNav,
  includeBlogNav,
  brand,
  profileDisplayName = "",
  profileRoleLabel = "",
  profileAvatarUrl = null,
}: AdminMobileDrawerProps) {
  const navDict = dict.dashboard.adminNav;
  const chromeDict = dict.dashboard.adminChrome;
  const { open, openDrawer, close } = useDashboardMobileDrawer();

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={openDrawer}
        aria-label={navDict.mobileOpen}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <DashboardMobileDrawerPortal open={open} onClose={close} dialogLabel={navDict.aria}>
        <div className="mx-auto flex h-dvh max-h-dvh max-w-[var(--layout-max-width)] flex-col overflow-hidden bg-[var(--color-background)] px-4 py-4 text-[var(--color-foreground)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
                {chromeDict.badge}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--color-primary)]">
                {navDict.aria}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={navDict.mobileClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {brand ? (
            <StaffSidebarBrand href={`/${locale}/dashboard/admin`} brand={brand} locale={locale} />
          ) : null}
          {profileDisplayName || profileRoleLabel ? (
            <AdminSidebarProfileFooter
              locale={locale}
              dict={dict}
              displayName={profileDisplayName}
              roleLabel={profileRoleLabel}
              avatarUrl={profileAvatarUrl}
            />
          ) : null}

          <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
            <AdminSidebarNavContent
              locale={locale}
              dict={navDict}
              newRegistrationsCount={newRegistrationsCount}
              recentInboundMessagesCount={recentInboundMessagesCount}
              includeEmailTemplatesNav={includeEmailTemplatesNav}
              includeBlogNav={includeBlogNav}
              onNavigate={close}
              variant="mobile"
              tone="light"
            />
          </div>

          <div className="mt-auto shrink-0 border-t border-[var(--color-border)] pt-3">
            <SignOutButton
              locale={locale}
              label={dict.nav.logout}
              title={chromeDict.signOutHint}
              className="w-full min-h-11 justify-start gap-3 rounded-xl px-4 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              iconClassName="h-6 w-6 shrink-0"
            />
          </div>
        </div>
      </DashboardMobileDrawerPortal>
    </div>
  );
}
