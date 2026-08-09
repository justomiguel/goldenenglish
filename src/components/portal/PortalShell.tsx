"use client";

import {
  useCallback,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { PortalShellConfig } from "@/lib/portal/portalShellTypes";
import { useAppSurface } from "@/hooks/useAppSurface";
import { PwaPullToRefresh } from "@/components/pwa/molecules/PwaPullToRefresh";
import { PortalAccountSheet } from "@/components/portal/PortalAccountSheet";
import { PortalSubjectChips } from "@/components/portal/PortalSubjectChips";
import { PortalTabBar } from "@/components/portal/PortalTabBar";
import { PortalTopNav } from "@/components/portal/PortalTopNav";

export interface PortalShellProps {
  locale: string;
  brand: BrandPublic;
  dict: Dictionary;
  config: PortalShellConfig;
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

function PortalBrand({ brand, href, badge }: { brand: BrandPublic; href: string; badge: string }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2.5">
      <Image
        src={brand.logoPath}
        alt={brand.logoAlt || brand.name}
        width={36}
        height={36}
        unoptimized={brand.logoPath.startsWith("/images/")}
        className="h-9 w-9 rounded-[var(--layout-border-radius)] object-contain"
        priority
      />
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold text-[var(--color-primary)]">
          {brand.name}
        </p>
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {badge}
        </p>
      </div>
    </Link>
  );
}

export function PortalShell({ locale, brand, dict, config, children }: PortalShellProps) {
  const mounted = useSyncExternalStore(subscribeReady, snapshotMounted, snapshotNotMounted);
  const surface = useAppSurface();
  const router = useRouter();
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-dvh animate-pulse bg-[var(--color-muted)]" aria-hidden>
        <div className="mx-auto h-16 max-w-[var(--layout-max-width)] border-b border-[var(--color-border)] bg-[var(--color-surface)]" />
      </div>
    );
  }

  const account = (
    <PortalAccountSheet
      locale={locale}
      items={config.accountItems}
      heading={config.accountHeading}
      openLabel={config.accountOpenLabel}
      closeLabel={config.accountCloseLabel}
      localeLabels={dict.common.locale}
      triggerTourAnchor={config.tourAnchors.account}
      signOutTourAnchor={config.tourAnchors.signOut}
    />
  );

  const chips = (
    <PortalSubjectChips
      groups={config.subjectGroups}
      tourAnchor={config.tourAnchors.subjectChips}
    />
  );

  if (surface === "web-desktop") {
    return (
      <div
        className="flex min-h-screen flex-col bg-[var(--color-muted)]"
        style={{ "--portal-header-offset": "4.25rem" } as CSSProperties}
      >
        <header
          {...(config.tourAnchors.header ? { "data-tour": config.tourAnchors.header } : {})}
          aria-label={config.ariaHeader}
          className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center gap-6 px-6 py-2.5">
            <PortalBrand brand={brand} href={config.baseHref} badge={config.brandBadge} />
            <div className="min-w-0 flex-1">
              <PortalTopNav
                destinations={config.destinations}
                ariaLabel={config.ariaTopNav}
                tourAnchor={config.tourAnchors.topNav}
              />
            </div>
            {account}
          </div>
        </header>

        {chips}

        <main className="mx-auto w-full max-w-[var(--layout-max-width)] flex-1 px-6 py-6">
          <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-8 py-8 shadow-sm">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-muted)]">
      <header
        {...(config.tourAnchors.header ? { "data-tour": config.tourAnchors.header } : {})}
        aria-label={config.ariaHeader}
        className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
      >
        <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between gap-3 px-4 py-2.5">
          <PortalBrand brand={brand} href={config.baseHref} badge={config.brandBadge} />
          {account}
        </div>
      </header>

      {chips}

      <main
        className="mx-auto w-full max-w-[var(--layout-max-width)] flex-1 px-4 py-4"
        style={{ paddingBottom: "calc(4.5rem + max(0.5rem, env(safe-area-inset-bottom, 0px)))" }}
      >
        <PwaPullToRefresh
          onRefresh={refresh}
          copy={dict.pwa.pullToRefresh}
          enabled={surface === "pwa-mobile"}
        >
          {children}
        </PwaPullToRefresh>
      </main>

      <PortalTabBar
        destinations={config.destinations}
        ariaLabel={config.ariaTabBar}
        tourAnchor={config.tourAnchors.tabBar}
      />
    </div>
  );
}
