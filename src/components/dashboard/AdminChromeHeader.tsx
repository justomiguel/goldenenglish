import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { AdminAttentionBell } from "@/components/dashboard/AdminAttentionBell";
import { StaffWorkspaceSwitch } from "@/components/dashboard/StaffWorkspaceSwitch";

interface AdminChromeHeaderProps {
  locale: string;
  brand: BrandPublic;
  dict: Dictionary;
  adminProfileRole: string;
  teacherPortalAllowed: boolean;
  mobileNav?: ReactNode;
  /** Hide the logo block when the brand already lives in the sidebar. */
  compactBrand?: boolean;
  newRegistrationsCount?: number;
  recentInboundMessagesCount?: number;
}

export function AdminChromeHeader({
  locale,
  brand,
  dict,
  adminProfileRole,
  teacherPortalAllowed,
  mobileNav,
  compactBrand = false,
  newRegistrationsCount = 0,
  recentInboundMessagesCount = 0,
}: AdminChromeHeaderProps) {
  const tagline = locale === "es" ? brand.tagline : brand.taglineEn;
  const labels = dict.dashboard.adminChrome;
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");
  const isTeacherProfile = adminProfileRole === "teacher";
  const teachingBadgeLabel = isTeacherProfile
    ? labels.teacherBadge
    : labels.teachingAccessBadge;

  return (
    <header
      data-tour="admin-chrome-header"
      className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-soft)] backdrop-blur-md"
      aria-label={labels.ariaHeader}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {mobileNav}
          {compactBrand ? (
            <div className="min-w-0">
              <StaffWorkspaceSwitch
                locale={locale}
                dict={dict}
                activeRole="admin"
                viewAs={null}
              />
              <p className="mt-1.5 hidden min-w-0 truncate text-xs text-[var(--color-muted-foreground)] sm:block">
                {tagline}
              </p>
            </div>
          ) : null}
          {!compactBrand ? (
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
          ) : null}
          {!compactBrand ? (
            <StaffWorkspaceSwitch
              locale={locale}
              dict={dict}
              activeRole="admin"
              viewAs={null}
            />
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href={`/${locale}`}
            data-tour="admin-chrome-back-to-site"
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
          <SignOutButton
            locale={locale}
            label={dict.nav.logout}
            title={labels.signOutHint}
            tourAnchor="admin-chrome-sign-out"
            className="min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-2 text-xs font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)] sm:px-3 sm:text-sm"
          />
          <AdminAttentionBell
            locale={locale}
            messagesCount={recentInboundMessagesCount}
            registrationsCount={newRegistrationsCount}
            messagesLabel={labels.bellMessages}
            registrationsLabel={labels.bellRegistrations}
            emptyLabel={labels.bellEmpty}
            ariaLabel={labels.bellAria}
          />
        </div>
      </div>
    </header>
  );
}
