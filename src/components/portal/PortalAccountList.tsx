"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Download } from "lucide-react";
import type { PortalAccountItem } from "@/lib/portal/portalShellTypes";
import type { LanguageSwitcherLabels } from "@/components/molecules/LanguageSwitcher";
import { LanguageSwitcherPwaList } from "@/components/pwa/molecules/LanguageSwitcherPwaList";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";

export interface PortalAccountListProps {
  locale: string;
  items: PortalAccountItem[];
  localeLabels: LanguageSwitcherLabels;
  signOutTourAnchor?: string;
  /** Called after a link is followed, so the sheet can close itself. */
  onNavigate?: () => void;
}

const rowClass =
  "flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-[var(--color-foreground)] active:bg-[var(--color-muted)]/50";

/**
 * The account rows, shared by the header sheet and the `/account` route so the two
 * can never drift into offering different things.
 */
export function PortalAccountList({
  locale,
  items,
  localeLabels,
  signOutTourAnchor,
  onNavigate,
}: PortalAccountListProps) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const { installable, busy: installBusy, install } = usePwaInstallPrompt();

  return (
    <ul className="m-0 divide-y divide-[var(--color-border)] p-0">
      {items.map((item) => {
        if (item.action === "signOut") {
          return (
            <li key={item.id}>
              <SignOutButton
                locale={locale}
                label={item.label}
                tourAnchor={signOutTourAnchor}
                className="min-h-[52px] w-full !justify-start px-4 py-3 text-left text-sm font-medium text-[var(--color-error)] active:bg-[var(--color-muted)]/50"
              />
            </li>
          );
        }

        if (item.action === "installApp") {
          if (!installable) return null;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void install()}
                disabled={installBusy}
                className={`${rowClass} disabled:opacity-60`}
              >
                <span>{item.label}</span>
                <Download
                  className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
                  aria-hidden
                />
              </button>
            </li>
          );
        }

        if (item.action === "language") {
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setLanguageOpen((value) => !value)}
                aria-expanded={languageOpen}
                className={rowClass}
              >
                <span>{item.label}</span>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform ${
                    languageOpen ? "rotate-90" : ""
                  }`}
                  aria-hidden
                />
              </button>
              {languageOpen ? (
                <div className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
                  <LanguageSwitcherPwaList locale={locale} labels={localeLabels} />
                </div>
              ) : null}
            </li>
          );
        }

        if (!item.href) return null;

        return (
          <li key={item.id}>
            <Link href={item.href} onClick={onNavigate} className={rowClass}>
              <span className="min-w-0">
                <span className="block truncate">{item.label}</span>
                {item.meta ? (
                  <span className="block truncate text-xs font-normal text-[var(--color-muted-foreground)]">
                    {item.meta}
                  </span>
                ) : null}
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
