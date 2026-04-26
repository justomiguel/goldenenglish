"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
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

export type UnderlineTabBarLayout = "row" | "gridTwoRow";

export interface UnderlineTabBarProps {
  /** Stable id fragment shared with tabpanels (e.g. from `useId().replace(/:/g, "")`). */
  idPrefix: string;
  ariaLabel: string;
  items: readonly UnderlineTabItem[];
  value: string;
  onChange: (id: string) => void;
  dense?: boolean;
  /**
   * `gridTwoRow`: 4+3 column grid (sm+) so labels fit; `row` is a single flex row.
   * On narrow viewports, `gridTwoRow` falls back to a single horizontal scroller.
   */
  layout?: UnderlineTabBarLayout;
}

const TABLIST_ROW =
  "flex w-full gap-0 border-b border-[var(--color-border)] bg-[var(--color-muted)]/15";

const TABLIST_GRID =
  "w-full border-b border-[var(--color-border)] bg-[var(--color-muted)]/15 " +
  "max-sm:flex max-sm:min-h-0 max-sm:min-w-0 max-sm:flex-nowrap max-sm:gap-0 " +
  "max-sm:overflow-x-auto max-sm:overflow-y-hidden max-sm:overscroll-x-contain " +
  "sm:grid sm:grid-cols-4 sm:grid-rows-2 sm:gap-0 sm:overflow-visible";

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
  layout = "row",
}: UnderlineTabBarProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const isGrid = layout === "gridTwoRow";

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

  useEffect(() => {
    const idx = items.findIndex((i) => i.id === value);
    if (idx < 0) return;
    queueMicrotask(() => {
      const el = refs.current[idx];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      }
    });
  }, [items, value]);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={isGrid ? TABLIST_GRID : TABLIST_ROW}
    >
      {items.map((item, i) => {
        const selected = item.id === value;
        const tabElId = underlineTabId(idPrefix, item.id);
        const panelElId = underlinePanelId(idPrefix, item.id);
        const Icon = item.Icon;
        const n = items.length;
        const noRightBorder =
          (i % 4) === 3 || (i === n - 1 && (i % 4) !== 3);
        const gridR = isGrid && !noRightBorder ? "sm:border-r sm:border-[var(--color-border)]/80" : "";
        const gridB = isGrid && i < 4 ? "sm:border-b sm:border-[var(--color-border)]/80" : "";
        const mobileR = isGrid && i < items.length - 1 ? "max-sm:border-r max-sm:border-[var(--color-border)]/60" : "";
        const rowFlex = isGrid
          ? "max-sm:shrink-0 max-sm:min-w-[6.25rem] max-sm:max-w-[11rem] sm:min-w-0 sm:max-w-none"
          : "min-w-0 flex-1";
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
            className={`relative flex items-center justify-center gap-2 ${rowFlex} ${pad} text-sm font-medium outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
              isGrid ? `min-h-[44px] ${gridR} ${gridB} ${mobileR}` : "min-h-[44px]"
            } ${
              selected
                ? "text-[var(--color-primary)] after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-[var(--color-primary)]"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/40 hover:text-[var(--color-foreground)]"
            }`}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
            <span
              className={
                selected
                  ? "break-words text-center text-balance whitespace-normal sm:max-w-none"
                  : "min-w-0 truncate text-center"
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
