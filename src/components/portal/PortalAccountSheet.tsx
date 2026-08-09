"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { User, X } from "lucide-react";
import type { PortalAccountItem } from "@/lib/portal/portalShellTypes";
import type { LanguageSwitcherLabels } from "@/components/molecules/LanguageSwitcher";
import { PortalAccountList } from "@/components/portal/PortalAccountList";

export interface PortalAccountSheetProps {
  locale: string;
  items: PortalAccountItem[];
  heading: string;
  openLabel: string;
  closeLabel: string;
  localeLabels: LanguageSwitcherLabels;
  triggerClassName?: string;
  triggerTourAnchor?: string;
  signOutTourAnchor?: string;
}

export function PortalAccountSheet({
  locale,
  items,
  heading,
  openLabel,
  closeLabel,
  localeLabels,
  triggerClassName = "",
  triggerTourAnchor,
  signOutTourAnchor,
}: PortalAccountSheetProps) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        aria-expanded={open}
        {...(triggerTourAnchor ? { "data-tour": triggerTourAnchor } : {})}
        className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-primary)] shadow-sm active:bg-[var(--color-muted)] ${triggerClassName}`}
      >
        <User className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-start sm:justify-end sm:p-4">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-black/40"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl sm:w-80 sm:rounded-2xl"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <h2 className="font-display text-sm font-semibold text-[var(--color-foreground)]">
                {heading}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label={closeLabel}
                className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-[var(--color-muted-foreground)] active:bg-[var(--color-muted)]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <PortalAccountList
              locale={locale}
              items={items}
              localeLabels={localeLabels}
              signOutTourAnchor={signOutTourAnchor}
              onNavigate={close}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
