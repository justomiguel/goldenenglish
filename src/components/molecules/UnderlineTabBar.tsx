"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";

export type UnderlineTabItem = {
  id: string;
  label: string;
  Icon?: LucideIcon;
};

export function underlineTabId(prefix: string, tabId: string) {
  return `${prefix}-tab-${tabId}`;
}

export function underlinePanelId(prefix: string, tabId: string) {
  return `${prefix}-panel-${tabId}`;
}

export interface UnderlineTabBarProps {
  /** Stable id fragment shared with tabpanels (e.g. from `useId().replace(/:/g, "")`). */
  idPrefix: string;
  ariaLabel: string;
  items: readonly UnderlineTabItem[];
  value: string;
  onChange: (id: string) => void;
  dense?: boolean;
  /** When set, label can wrap to two lines (narrow tab strips with long copy). */
  allowLabelWrap?: boolean;
}

/**
 * Accessible underline tabs (WAI-ARIA APG): bottom indicator, ArrowLeft/Right, Home, End.
 */
export function UnderlineTabBar({
  idPrefix,
  ariaLabel,
  items,
  value,
  onChange,
  dense,
  allowLabelWrap,
}: UnderlineTabBarProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusAt = useCallback(
    (index: number) => {
      const n = ((index % items.length) + items.length) % items.length;
      onChange(items[n].id);
      queueMicrotask(() => refs.current[n]?.focus());
    },
    [items, onChange],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const idx = items.findIndex((i) => i.id === value);
      if (idx < 0) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        focusAt(idx + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusAt(idx - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        focusAt(0);
      } else if (e.key === "End") {
        e.preventDefault();
        focusAt(items.length - 1);
      }
    },
    [focusAt, items, value],
  );

  const pad = dense ? "px-2 py-2.5 sm:px-3" : "px-3 py-3 sm:px-4";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className="flex w-full gap-0 border-b border-[var(--color-border)] bg-[var(--color-muted)]/15"
    >
      {items.map((item, i) => {
        const selected = item.id === value;
        const tabElId = underlineTabId(idPrefix, item.id);
        const panelElId = underlinePanelId(idPrefix, item.id);
        const Icon = item.Icon;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={tabElId}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelElId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`relative flex min-w-0 flex-1 items-center justify-center gap-2 ${pad} text-sm font-medium outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
              allowLabelWrap ? "min-h-[52px] sm:min-h-[48px]" : "min-h-[44px]"
            } ${
              selected
                ? "text-[var(--color-primary)] after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-[var(--color-primary)]"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/40 hover:text-[var(--color-foreground)]"
            }`}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
            <span
              className={
                allowLabelWrap
                  ? "text-balance text-center text-xs leading-tight [overflow-wrap:anywhere] sm:text-sm"
                  : "truncate"
              }
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
