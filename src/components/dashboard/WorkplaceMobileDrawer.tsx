"use client";

import Link from "next/link";
import { ExternalLink, Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { WorkplaceNavGroup } from "@/lib/dashboard/workplaceNav";
import { AdminSidebarProfileFooter } from "@/components/dashboard/AdminSidebarProfileFooter";
import { DashboardMobileDrawerPortal } from "@/components/dashboard/DashboardMobileDrawerPortal";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { StaffDrawerSignOut } from "@/components/dashboard/StaffDrawerSignOut";
import { StaffSidebarBrand } from "@/components/dashboard/StaffSidebarBrand";
import { WorkplaceNavList } from "@/components/dashboard/WorkplaceNavList";
import { useDashboardMobileDrawer } from "@/hooks/useDashboardMobileDrawer";

export function WorkplaceMobileDrawer({
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
  navGroups,
  navTourId,
  profileDisplayName,
  profileRoleLabel,
  profileAvatarUrl,
  hideSignOut = false,
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
  navGroups: WorkplaceNavGroup[];
  navTourId?: string;
  profileDisplayName: string;
  profileRoleLabel: string;
  profileAvatarUrl: string | null;
  hideSignOut?: boolean;
}): ReactNode {
  const { open, openDrawer, close } = useDashboardMobileDrawer();

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={openDrawer}
        aria-label={mobileOpen}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <DashboardMobileDrawerPortal open={open} onClose={close} dialogLabel={navAria}>
        <div className="mx-auto flex h-dvh max-h-dvh max-w-[var(--layout-max-width)] flex-col overflow-hidden bg-[var(--color-background)] px-4 py-4 text-[var(--color-foreground)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
                {roleBadge}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--color-primary)]">{navAria}</h2>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={mobileClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <StaffSidebarBrand href={homeHref} brand={brand} locale={locale} />
          <AdminSidebarProfileFooter
            locale={locale}
            dict={dict}
            displayName={profileDisplayName}
            roleLabel={profileRoleLabel}
            avatarUrl={profileAvatarUrl}
          />

          <div className="mt-5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/${locale}`}
                onClick={close}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                <span>{backToSite}</span>
              </Link>
              <LanguageSwitcher
                locale={locale}
                labels={dict.common.locale}
                variant="compact"
                tourAnchor="admin-chrome-locale"
              />
            </div>
          </div>

          <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
            <WorkplaceNavList
              groups={navGroups}
              ariaLabel={navAria}
              tourId={navTourId}
              onNavigate={close}
              variant="mobile"
            />
          </div>

          {hideSignOut ? null : (
            <StaffDrawerSignOut locale={locale} label={dict.nav.logout} title={signOutTitle} />
          )}
        </div>
      </DashboardMobileDrawerPortal>
    </div>
  );
}
