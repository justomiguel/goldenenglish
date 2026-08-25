import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { StaffWorkspaceSwitch } from "@/components/dashboard/StaffWorkspaceSwitch";
import type { ViewAsSubject } from "@/lib/dashboard/viewAsTypes";

export interface TeacherChromeHeaderProps {
  locale: string;
  brand: BrandPublic;
  dict: Dictionary;
  showAdminWorkspace?: boolean;
  mobileNav?: ReactNode;
  /** Logo link target (default: teacher dashboard home). */
  dashboardHomeHref?: string;
  /** Header badge and aria copy (default: `dict.dashboard.teacherChrome`). */
  chromeLabels?: Dictionary["dashboard"]["teacherChrome"] | Dictionary["dashboard"]["assistantChrome"];
  /** Hide the logo when it already lives in the sidebar. */
  compactBrand?: boolean;
  viewAs?: ViewAsSubject | null;
}

export function TeacherChromeHeader({
  locale,
  brand,
  dict,
  showAdminWorkspace = false,
  mobileNav,
  dashboardHomeHref,
  chromeLabels,
  compactBrand = false,
  viewAs = null,
}: TeacherChromeHeaderProps) {
  const tagline = locale === "es" ? brand.tagline : brand.taglineEn;
  const labels = chromeLabels ?? dict.dashboard.teacherChrome;
  const homeHref = dashboardHomeHref ?? `/${locale}/dashboard/teacher`;
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-soft)] backdrop-blur-md"
      aria-label={labels.ariaHeader}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {mobileNav}
          {compactBrand ? (
            <div className="min-w-0">
              {showAdminWorkspace || viewAs ? (
                <StaffWorkspaceSwitch
                  locale={locale}
                  dict={dict}
                  activeRole="teacher"
                  viewAs={viewAs}
                />
              ) : null}
              <p className="mt-1.5 hidden min-w-0 truncate text-xs text-[var(--color-muted-foreground)] sm:block">
                {tagline}
              </p>
            </div>
          ) : (
          <Link
            href={homeHref}
            className="group flex min-w-0 flex-1 items-center gap-3 rounded-[var(--layout-border-radius)] outline-none ring-[var(--color-primary)] transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <div className="shrink-0 rounded-[var(--layout-border-radius)] bg-[var(--color-background)] p-1.5 shadow-sm ring-1 ring-[var(--color-border)] transition group-hover:ring-[var(--color-accent)]/40">
              <Image
                src={brand.logoPath}
                alt={brand.logoAlt || brand.name}
                width={44}
                height={44}
                unoptimized={bypassLogoOptimizer}
                className="block h-9 w-9 rounded-[var(--layout-border-radius)] object-contain md:h-10 md:w-10"
                priority
              />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-display text-base font-semibold tracking-tight text-[var(--color-primary)] md:text-xl">
                  {brand.name}
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/70 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] md:text-[0.65rem]">
                  {labels.badge}
                </span>
                {showAdminWorkspace && "adminBadge" in labels ? (
                  <span className="rounded-full border border-[var(--color-secondary)]/40 bg-[var(--color-secondary)]/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--color-secondary)] md:text-[0.65rem]">
                    {labels.adminBadge}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 hidden line-clamp-1 text-xs text-[var(--color-muted-foreground)] sm:block">
                {tagline}
              </p>
            </div>
          </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href={`/${locale}`}
            aria-label={labels.backToSite}
            title={labels.backToSite}
            className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-2 text-xs font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)] sm:min-w-0 sm:justify-start sm:px-3 sm:text-sm"
          >
            <ExternalLink
              className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
              aria-hidden
              strokeWidth={2}
            />
            <span className="hidden sm:inline">{labels.backToSite}</span>
          </Link>
          {viewAs ? null : (
          <SignOutButton
            locale={locale}
            label={dict.nav.logout}
            title={labels.signOutHint}
            className="min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-2 text-xs font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)] sm:px-3 sm:text-sm"
          />
          )}
          <LanguageSwitcher locale={locale} labels={dict.common.locale} />
        </div>
      </div>
    </header>
  );
}
