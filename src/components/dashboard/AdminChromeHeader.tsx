import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, GraduationCap } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface AdminChromeHeaderProps {
  locale: string;
  brand: BrandPublic;
  dict: Dictionary;
  adminProfileRole: string;
  teacherPortalAllowed: boolean;
  mobileNav?: ReactNode;
}

export function AdminChromeHeader({
  locale,
  brand,
  dict,
  adminProfileRole,
  teacherPortalAllowed,
  mobileNav,
}: AdminChromeHeaderProps) {
  const tagline = locale === "es" ? brand.tagline : brand.taglineEn;
  const labels = dict.dashboard.adminChrome;
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");
  const isTeacherProfile = adminProfileRole === "teacher";
  const teachingBadgeLabel = isTeacherProfile
    ? labels.teacherBadge
    : labels.teachingAccessBadge;
  const teacherHref = `/${locale}/dashboard/teacher`;

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-soft)] backdrop-blur-md"
      aria-label={labels.ariaHeader}
    >
      <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {mobileNav}
          <Link
            href={`/${locale}/dashboard/admin`}
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
                {teacherPortalAllowed ? (
                  <span className="rounded-full border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--color-primary)] md:text-[0.65rem]">
                    {teachingBadgeLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 hidden line-clamp-1 text-xs text-[var(--color-muted-foreground)] sm:block">
                {tagline}
              </p>
            </div>
          </Link>
        </div>

        {teacherPortalAllowed ? (
          <Link
            href={teacherHref}
            aria-label={labels.openTeacherDashboardAria}
            title={labels.openTeacherDashboard}
            className="inline-flex shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)] shadow-sm transition hover:bg-[var(--color-primary)]/15 md:hidden"
          >
            <GraduationCap className="h-5 w-5" aria-hidden strokeWidth={2} />
          </Link>
        ) : null}

        <div className="hidden shrink-0 items-center gap-2 sm:gap-3 md:flex">
          {teacherPortalAllowed ? (
            <Link
              href={teacherHref}
              aria-label={labels.openTeacherDashboardAria}
              title={labels.openTeacherDashboard}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2.5 py-2 text-xs font-medium text-[var(--color-primary)] shadow-sm transition hover:bg-[var(--color-primary)]/15 sm:px-3 sm:text-sm"
            >
              <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2} />
              <span className="hidden sm:inline">{labels.openTeacherDashboard}</span>
            </Link>
          ) : null}
          <Link
            href={`/${locale}`}
            aria-label={labels.backToSite}
            title={labels.backToSite}
            className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-2 text-xs font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)] sm:min-w-0 sm:justify-start sm:px-3 sm:text-sm"
          >
            <ExternalLink
              className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] sm:mt-px"
              aria-hidden
              strokeWidth={2}
            />
            <span className="hidden sm:inline">{labels.backToSite}</span>
          </Link>
          <SignOutButton
            locale={locale}
            label={dict.nav.logout}
            title={labels.signOutHint}
            className="min-h-10 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-2 text-xs font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)] sm:px-3 sm:text-sm"
          />
          <LanguageSwitcher locale={locale} labels={dict.common.locale} />
        </div>
      </div>
    </header>
  );
}
