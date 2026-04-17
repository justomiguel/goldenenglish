"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Menu, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import {
  AdminSidebarNavContent,
  type AdminTeacherNavLabels,
} from "@/components/dashboard/AdminSidebarNavContent";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

export interface AdminMobileDrawerProps {
  locale: string;
  dict: Dictionary;
  newRegistrationsCount: number;
  teacherNav?: AdminTeacherNavLabels;
}

export function AdminMobileDrawer({
  locale,
  dict,
  newRegistrationsCount,
  teacherNav,
}: AdminMobileDrawerProps) {
  const navDict = dict.dashboard.adminNav;
  const chromeDict = dict.dashboard.adminChrome;
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  /** Tailwind `md` — close when widening past mobile so overlay is not hidden by `md:hidden` while body stays locked. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => {
      if (mq.matches) close();
    };
    onMq();
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, [close]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={navDict.mobileOpen}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div
            className="fixed inset-0 z-[61] overflow-y-auto bg-[var(--color-muted)] animate-in fade-in duration-200"
            role="dialog"
            aria-label={navDict.aria}
          >
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
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/${locale}`}
                    onClick={close}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    <span>{chromeDict.backToSite}</span>
                  </Link>
                  <SignOutButton
                    locale={locale}
                    label={dict.nav.logout}
                    title={chromeDict.signOutHint}
                    className="min-h-11 flex-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
                  />
                </div>
                <div className="mt-3 flex justify-center">
                  <LanguageSwitcher
                    locale={locale}
                    labels={dict.common.locale}
                    variant="compact"
                  />
                </div>
              </div>

              <div className="mt-5 flex-1">
              <AdminSidebarNavContent
                locale={locale}
                dict={navDict}
                newRegistrationsCount={newRegistrationsCount}
                teacherNav={teacherNav}
                onNavigate={close}
                variant="mobile"
              />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
