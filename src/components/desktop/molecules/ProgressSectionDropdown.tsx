"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { UnreadCountPill } from "@/components/atoms/UnreadCountPill";
import {
  formatProgressUnread,
  type ProgressPickerCopy,
} from "@/lib/parent/formatProgressSectionLabels";
import { totalUnread, type ProgressPickerOption } from "@/components/parent/progressPickerOption";

export interface ProgressSectionDropdownProps {
  options: ProgressPickerOption[];
  value: string;
  onChange: (id: string) => void;
  copy: ProgressPickerCopy;
}

/** Pointer-first section picker: a combobox trigger over a WAI-ARIA listbox. */
export function ProgressSectionDropdown({
  options,
  value,
  onChange,
  copy,
}: ProgressSectionDropdownProps) {
  const rawId = useId().replace(/:/g, "");
  const ids = {
    label: `${rawId}-label`,
    value: `${rawId}-value`,
    list: `${rawId}-list`,
    option: (optionId: string) => `${rawId}-option-${optionId}`,
  };
  const selectedIndex = Math.max(
    options.findIndex((option) => option.id === value),
    0,
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const close = useCallback((focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.id);
      close(true);
    },
    [close, onChange, options],
  );

  const onListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLUListElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(options.length - 1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        commit(activeIndex);
      } else if (event.key === "Escape" || event.key === "Tab") {
        event.preventDefault();
        close(true);
      }
    },
    [activeIndex, close, commit, options.length],
  );

  const selected = options[selectedIndex];
  if (!selected) return null;

  if (options.length === 1) {
    return (
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {copy.label}
        </p>
        <p className="mt-1 flex items-center gap-2 text-base font-semibold text-[var(--color-foreground)]">
          <selected.Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          {selected.label}
          <span className="text-sm font-normal text-[var(--color-muted-foreground)]">
            {selected.countLabel}
          </span>
        </p>
      </div>
    );
  }

  const pendingLabel = formatProgressUnread(totalUnread(options), copy);

  return (
    <div className="relative min-w-0 sm:w-72" ref={containerRef}>
      <p
        id={ids.label}
        className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]"
      >
        {copy.label}
      </p>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={ids.list}
        aria-labelledby={`${ids.label} ${ids.value}`}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((prev) => !prev);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(selectedIndex);
            setOpen(true);
          }
        }}
        className="mt-1 flex min-h-[44px] w-full items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left outline-none transition-colors hover:border-[var(--color-primary)]/60 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      >
        <selected.Icon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
        <span id={ids.value} className="truncate text-sm font-semibold text-[var(--color-foreground)]">
          {selected.label}
        </span>
        <span className="truncate text-xs text-[var(--color-muted-foreground)]">
          {selected.countLabel}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <UnreadCountPill label={pendingLabel} />
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={ids.list}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={ids.label}
          aria-activedescendant={ids.option(options[activeIndex]?.id ?? selected.id)}
          onKeyDown={onListKeyDown}
          className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg outline-none"
        >
          {options.map((option, index) => {
            const isSelected = option.id === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.id}
                id={ids.option(option.id)}
                role="option"
                aria-selected={isSelected}
                onClick={() => commit(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm ${
                  isActive ? "bg-[var(--color-muted)]/60" : ""
                }`}
              >
                <option.Icon
                  className={`h-4 w-4 shrink-0 ${isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"}`}
                  aria-hidden
                />
                <span className="truncate font-medium text-[var(--color-foreground)]">
                  {option.label}
                </span>
                <span className="truncate text-xs text-[var(--color-muted-foreground)]">
                  {option.countLabel}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <UnreadCountPill label={option.unreadLabel} ariaLabel={option.unreadAria} />
                  {isSelected ? (
                    <Check className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
