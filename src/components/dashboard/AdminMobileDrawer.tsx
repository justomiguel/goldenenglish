"use client";

import { Menu, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { AdminSidebarNavContent } from "@/components/dashboard/AdminSidebarNavContent";
import { DashboardMobileDrawerPortal } from "@/components/dashboard/DashboardMobileDrawerPortal";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { useDashboardMobileDrawer } from "@/hooks/useDashboardMobileDrawer";

export interface AdminMobileDrawerProps {
  locale: string;
  dict: Dictionary;
  newRegistrationsCount: number;
  recentInboundMessagesCount: number;
  includeEmailTemplatesNav?: boolean;
  includeBlogNav?: boolean;
}

export function AdminMobileDrawer({
  locale,
  dict,
  newRegistrationsCount,
  recentInboundMessagesCount,
  includeEmailTemplatesNav,
  includeBlogNav,
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
        <div className="mx-auto flex min-h-dvh max-w-[var(--layout-max-width)] flex-col px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
                {chromeDict.badge}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
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

          <div className="mt-5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
            <SignOutButton
              locale={locale}
              label={dict.nav.logout}
              title={chromeDict.signOutHint}
              className="min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
            />
          </div>

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
            />
          </div>
        </div>
      </DashboardMobileDrawerPortal>
    </div>
  );
}
