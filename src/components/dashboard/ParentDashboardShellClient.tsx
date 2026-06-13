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
  /** Dashboard base path, e.g. `/es/dashboard/parent` or `/es/dashboard/student`. */
  baseHref?: string;
  /** When false, payments nav/tab entries are omitted (student minors). */
  includePayments?: boolean;
  /** Override chrome labels; defaults to parent chrome. */
  chromeLabels?: Dictionary["dashboard"]["parentChrome"];
  /** Override nav dict; defaults to parent nav. */
  navDict?: Dictionary["dashboard"]["parentNav"];
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
  baseHref,
  includePayments,
  chromeLabels,
  navDict,
}: ParentDashboardShellClientProps) {
  const nav = navDict ?? dict.dashboard.parentNav;
  const chrome = chromeLabels ?? dict.dashboard.parentChrome;
  const base = baseHref ?? `/${locale}/dashboard/parent`;
  const profileHref = `/${locale}/dashboard/profile`;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]">
      <StudentChromeHeader
        locale={locale}
        brand={brand}
        dict={dict}
        homeHref={base}
        labels={chrome}
      />
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 gap-0 md:gap-8 md:px-2 md:pb-8 md:pt-2">
        <ParentSidebar
          locale={locale}
          dict={nav}
          baseHref={base}
          profileHref={profileHref}
          includePayments={includePayments}
        />
        <div className="min-w-0 flex-1 px-4 py-6 md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-background)] md:px-8 md:py-8 md:shadow-sm">
          <ParentBreadcrumb locale={locale} dict={nav} baseHref={base} />
          {children}
        </div>
      </div>
    </div>
  );
}

export function ParentDashboardShellClient({
  baseHref,
  includePayments = true,
  chromeLabels,
  navDict,
  ...props
}: ParentDashboardShellClientProps) {
  const mounted = useSyncExternalStore(subscribeReady, snapshotMounted, snapshotNotMounted);
  const surface = useAppSurface();
  const locale = props.locale;
  const base = baseHref ?? `/${locale}/dashboard/parent`;

  if (!mounted) {
    return (
      <div className="min-h-screen animate-pulse bg-[var(--color-muted)]" aria-hidden>
        <div className="mx-auto h-16 max-w-[var(--layout-max-width)] border-b border-[var(--color-border)] bg-[var(--color-surface)]" />
      </div>
    );
  }

  if (surface === "web-desktop") {
    return (
      <ParentDesktopShell
        {...props}
        baseHref={base}
        includePayments={includePayments}
        chromeLabels={chromeLabels}
        navDict={navDict}
      />
    );
  }

  return (
    <ParentPwaShell
      locale={props.locale}
      brand={props.brand}
      dict={props.dict}
      baseHref={base}
      includePayments={includePayments}
      chromeLabels={chromeLabels}
      navDict={navDict}
    >
      {props.children}
    </ParentPwaShell>
  );
}
