"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { ParentPwaTabBar } from "@/components/pwa/molecules/ParentPwaTabBar";

interface ParentPwaShellProps {
  locale: string;
  brand: BrandPublic;
  dict: Dictionary;
  children: ReactNode;
  baseHref?: string;
  profileHref?: string;
}

const headerActionClass =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-primary)] shadow-sm active:bg-[var(--color-muted)]";

export function ParentPwaShell({
  locale,
  brand,
  dict,
  children,
  baseHref = `/${locale}/dashboard/parent`,
  profileHref = `/${locale}/dashboard/profile`,
}: ParentPwaShellProps) {
  const chrome = dict.dashboard.parentChrome;
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-muted)]">
      <header
        className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
        aria-label={chrome.ariaHeader}
      >
        <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between gap-3 px-4 py-2.5">
          <Link href={baseHref} className="flex min-w-0 items-center gap-2.5">
            <Image
              src={brand.logoPath}
              alt={brand.logoAlt || brand.name}
              width={36}
              height={36}
              unoptimized={bypassLogoOptimizer}
              className="h-9 w-9 rounded-[var(--layout-border-radius)] object-contain"
              priority
            />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-[var(--color-primary)]">
                {brand.name}
              </p>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {chrome.badge}
              </p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={profileHref}
              aria-label={dict.dashboard.parentNav.myProfile}
              title={dict.dashboard.parentNav.tipMyProfile}
              className={headerActionClass}
            >
              <User className="h-5 w-5" aria-hidden />
            </Link>
            <SignOutButton
              locale={locale}
              label={dict.nav.logout}
              title={chrome.signOutHint}
              iconOnly
              className={headerActionClass}
            />
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-[var(--layout-max-width)] flex-1 px-4 py-4"
        style={{ paddingBottom: "calc(4.5rem + max(0.5rem, env(safe-area-inset-bottom, 0px)))" }}
      >
        {children}
      </main>

      <ParentPwaTabBar locale={locale} dict={dict.dashboard.parentNav} baseHref={baseHref} />
    </div>
  );
}
