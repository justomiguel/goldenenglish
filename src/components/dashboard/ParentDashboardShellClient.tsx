"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { useAppSurface } from "@/hooks/useAppSurface";
import { StudentChromeHeader } from "@/components/dashboard/StudentChromeHeader";
import { ParentSidebar } from "@/components/dashboard/ParentSidebar";
import { ParentBreadcrumb } from "@/components/dashboard/ParentBreadcrumb";
import { ParentPwaShell } from "@/components/pwa/organisms/ParentPwaShell";

export interface ParentDashboardShellClientProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  children: ReactNode;
}

function subscribeReady(onStoreChange: () => void) {
  queueMicrotask(onStoreChange);
  return () => {};
}

function snapshotMounted() {
  return true;
}

function snapshotNotMounted() {
  return false;
}

function ParentDesktopShell({
  locale,
  dict,
  brand,
  children,
}: ParentDashboardShellClientProps) {
  const navDict = dict.dashboard.parentNav;
  const chromeLabels = dict.dashboard.parentChrome;
  const baseHref = `/${locale}/dashboard/parent`;
  const profileHref = `/${locale}/dashboard/profile`;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]">
      <StudentChromeHeader
        locale={locale}
        brand={brand}
        dict={dict}
        homeHref={baseHref}
        labels={chromeLabels}
      />
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 gap-0 md:gap-8 md:px-2 md:pb-8 md:pt-2">
        <ParentSidebar locale={locale} dict={navDict} baseHref={baseHref} profileHref={profileHref} />
        <div className="min-w-0 flex-1 px-4 py-6 md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-background)] md:px-8 md:py-8 md:shadow-sm">
          <ParentBreadcrumb locale={locale} dict={navDict} baseHref={baseHref} />
          {children}
        </div>
      </div>
    </div>
  );
}

export function ParentDashboardShellClient(props: ParentDashboardShellClientProps) {
  const mounted = useSyncExternalStore(subscribeReady, snapshotMounted, snapshotNotMounted);
  const surface = useAppSurface();

  if (!mounted) {
    return (
      <div className="min-h-screen animate-pulse bg-[var(--color-muted)]" aria-hidden>
        <div className="mx-auto h-16 max-w-[var(--layout-max-width)] border-b border-[var(--color-border)] bg-[var(--color-surface)]" />
      </div>
    );
  }

  if (surface === "web-desktop") {
    return <ParentDesktopShell {...props} />;
  }

  return (
    <ParentPwaShell locale={props.locale} brand={props.brand} dict={props.dict}>
      {props.children}
    </ParentPwaShell>
  );
}
