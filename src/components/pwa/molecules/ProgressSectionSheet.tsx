"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { UnreadCountPill } from "@/components/atoms/UnreadCountPill";
import {
  formatProgressUnread,
  type ProgressPickerCopy,
} from "@/lib/parent/formatProgressSectionLabels";
import { totalUnread, type ProgressPickerOption } from "@/components/parent/progressPickerOption";

export interface ProgressSectionSheetProps {
  options: ProgressPickerOption[];
  value: string;
  onChange: (id: string) => void;
  copy: ProgressPickerCopy;
}

/** Touch-first section picker: a full-width trigger that opens a bottom sheet of thumb-sized rows. */
export function ProgressSectionSheet({ options, value, onChange, copy }: ProgressSectionSheetProps) {
  const rawId = useId().replace(/:/g, "");
  const titleId = `${rawId}-title`;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const selected = options.find((option) => option.id === value) ?? options[0];

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  if (!selected) return null;

  if (options.length === 1) {
    return (
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <p className="flex items-center gap-2 text-base font-semibold text-[var(--color-foreground)]">
          <selected.Icon className="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
          {selected.label}
        </p>
        <p className="mt-0.5 pl-7 text-sm text-[var(--color-muted-foreground)]">
          {selected.countLabel}
        </p>
      </div>
    );
  }

  const pendingLabel = formatProgressUnread(totalUnread(options), copy);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${copy.triggerAria}: ${selected.label}`}
        onClick={() => setOpen(true)}
        className="flex min-h-[56px] w-full items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left active:bg-[var(--color-muted)]/40"
      >
        <selected.Icon className="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-[var(--color-foreground)]">
            {selected.label}
          </span>
          <span className="block truncate text-sm text-[var(--color-muted-foreground)]">
            {selected.countLabel}
          </span>
        </span>
        <UnreadCountPill label={pendingLabel} />
        <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            data-testid="progress-section-sheet-backdrop"
            className="absolute inset-0 bg-black/40"
            onClick={close}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full rounded-t-2xl bg-[var(--color-surface)] pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 id={titleId} className="text-base font-semibold text-[var(--color-foreground)]">
                {copy.sheetTitle}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label={copy.close}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-muted-foreground)] active:bg-[var(--color-muted)]/50"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <ul role="listbox" aria-labelledby={titleId} className="mt-2 px-2 pb-2">
              {options.map((option) => {
                const isSelected = option.id === value;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.id);
                        close();
                      }}
                      className={`flex min-h-[56px] w-full items-center gap-3 rounded-[var(--layout-border-radius)] px-3 py-3 text-left active:bg-[var(--color-muted)]/50 ${
                        isSelected ? "bg-[var(--color-muted)]/40" : ""
                      }`}
                    >
                      <option.Icon
                        className={`h-5 w-5 shrink-0 ${isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"}`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-[var(--color-foreground)]">
                          {option.label}
                        </span>
                        <span className="block truncate text-sm text-[var(--color-muted-foreground)]">
                          {option.countLabel}
                        </span>
                      </span>
                      <UnreadCountPill label={option.unreadLabel} ariaLabel={option.unreadAria} />
                      {isSelected ? (
                        <Check className="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
