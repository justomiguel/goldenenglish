"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import type { PublicExperienceVariant } from "@/lib/theme/publicExperienceNav";

export type PublicHeaderAccountTone = PublicExperienceVariant;

const LOGIN_CLASS: Record<PublicHeaderAccountTone, string> = {
  default:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
  mozarthitos: "mz-chrome-login",
  espaciozenit:
    "border border-white/25 bg-transparent text-white hover:bg-white/10",
  nago: "border border-[var(--nago-gold)] bg-transparent text-[var(--nago-gold)] hover:bg-[var(--nago-gold)] hover:text-[var(--nago-ink)]",
  mimundo:
    "border border-[var(--mm-green)] bg-white text-[var(--mm-green)] hover:bg-[var(--mm-cream)]",
  liora:
    "border border-[var(--liora-rose-deep)] bg-white text-[var(--liora-rose-deep)] hover:bg-[var(--liora-cream)]",
};

const PORTAL_CLASS: Record<PublicHeaderAccountTone, string> = {
  default:
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)]",
  mozarthitos: "mz-chrome-dash",
  espaciozenit: "bg-[var(--ez-cyan)] text-[var(--ez-ink)] hover:bg-white",
  nago: "bg-[var(--nago-gold)] text-[var(--nago-ink-on-light)] hover:bg-[var(--nago-gold-soft)]",
  mimundo: "bg-[var(--mm-green)] text-white hover:bg-[var(--mm-blue-dark)]",
  liora: "bg-[var(--liora-rose-deep)] text-white hover:bg-[var(--liora-ink)]",
};

export interface PublicHeaderAccountCtaProps {
  locale: string;
  sessionEmail: string | null;
  loginLabel: string;
  /** Short label on viewports below `sm`. Falls back to `loginLabel`. */
  loginShort?: string;
  portalLabel: string;
  logoutLabel: string;
  tone?: PublicHeaderAccountTone;
  showLogout?: boolean;
  className?: string;
}

const PILL =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function PublicHeaderAccountCta({
  locale,
  sessionEmail,
  loginLabel,
  loginShort,
  portalLabel,
  logoutLabel,
  tone = "default",
  showLogout = false,
  className = "",
}: PublicHeaderAccountCtaProps) {
  if (!sessionEmail) {
    const shortLabel = loginShort && loginShort !== loginLabel ? loginShort : null;
    return (
      <Link
        href={`/${locale}/login`}
        aria-label={loginLabel}
        className={`${PILL} ${LOGIN_CLASS[tone]} ${className}`}
      >
        <LogIn className="h-4 w-4 shrink-0" aria-hidden />
        {shortLabel ? (
          <>
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{loginLabel}</span>
          </>
        ) : (
          loginLabel
        )}
      </Link>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Link
        href={`/${locale}/dashboard`}
        className={`${PILL} ${PORTAL_CLASS[tone]}`}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
        {portalLabel}
      </Link>
      {showLogout ? (
        <SignOutButton
          locale={locale}
          label={logoutLabel}
          iconOnly
          title={logoutLabel}
          className="min-h-11 min-w-11 rounded-full border border-[var(--color-border)] px-2 text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        />
      ) : null}
    </span>
  );
}
