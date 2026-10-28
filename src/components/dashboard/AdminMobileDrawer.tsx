"use client";

import { Menu } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { AdminHamburgerMenu } from "@/components/dashboard/AdminHamburgerMenu";
import { DashboardMobileDrawerPortal } from "@/components/dashboard/DashboardMobileDrawerPortal";
import { useAdminMobileShell } from "@/components/dashboard/AdminMobileShellContext";
import { useDashboardMobileDrawer } from "@/hooks/useDashboardMobileDrawer";

export interface AdminMobileDrawerProps {
  locale: string;
  dict: Dictionary;
  newRegistrationsCount: number;
  recentInboundMessagesCount: number;
  includeEmailTemplatesNav?: boolean;
  includeBlogNav?: boolean;
  includeMerchNav?: boolean;
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
  includeBlogNav,
  includeMerchNav,
  brand,
  profileDisplayName = "",
  profileRoleLabel = "",
  profileAvatarUrl = null,
}: AdminMobileDrawerProps) {
  const navDict = dict.dashboard.adminNav;
  const shared = useAdminMobileShell();
  const local = useDashboardMobileDrawer();
  const { open, openDrawer, close } = shared ?? local;

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={openDrawer}
        aria-label={navDict.mobileOpen}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm transition-colors hover:bg-[var(--color-muted)]"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <DashboardMobileDrawerPortal open={open} onClose={close} dialogLabel={navDict.aria}>
        <AdminHamburgerMenu
          locale={locale}
          dict={dict}
          newRegistrationsCount={newRegistrationsCount}
          recentInboundMessagesCount={recentInboundMessagesCount}
          includeBlogNav={includeBlogNav}
          includeMerchNav={includeMerchNav}
          profileDisplayName={profileDisplayName}
          profileRoleLabel={profileRoleLabel}
          profileAvatarUrl={profileAvatarUrl}
          brand={brand}
          onClose={close}
        />
      </DashboardMobileDrawerPortal>
    </div>
  );
}
