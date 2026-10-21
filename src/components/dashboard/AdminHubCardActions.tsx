"use client";

import { ArrowDown, ArrowUp, Check, EyeOff, Lock } from "lucide-react";
import type { AdminHomeCardSize, AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";
import { adminHomeSizeAllowed } from "@/lib/dashboard/adminHomeLayout";
import type { Dictionary } from "@/types/i18n";

const SIZES: AdminHomeCardSize[] = ["s", "m", "l", "full"];

const BAR_WIDTH: Record<AdminHomeCardSize, string> = {
  s: "w-1/3",
  m: "w-1/2",
  l: "w-2/3",
  full: "w-full",
};

const rowClass =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] disabled:cursor-not-allowed disabled:text-[var(--color-muted-foreground)] disabled:hover:bg-transparent";

function SizeBar({ size, selected, locked }: { size: AdminHomeCardSize; selected: boolean; locked: boolean }) {
  const fill = locked ? "bg-[var(--color-border)]" : selected ? "bg-[var(--color-primary)]" : "bg-[var(--color-foreground)]";
  return (
    <span className="flex h-2 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--color-muted)]" aria-hidden>
      <span className={`h-full rounded-full ${fill} ${BAR_WIDTH[size]}`} />
    </span>
  );
}

function lockCopy(id: AdminHomeWidgetId, labels: Dictionary["admin"]["home"]["layout"]): string | null {
  if (id === "traffic") return labels.sizeLockedTraffic;
  if (id === "collections") return labels.sizeLockedCollections;
  return null;
}

export function AdminHubCardActions({
  id,
  labels,
  currentSize,
  onSize,
  onMove,
  onHide,
}: {
  id: AdminHomeWidgetId;
  labels: Dictionary["admin"]["home"]["layout"];
  currentSize?: AdminHomeCardSize;
  onSize: (size: AdminHomeCardSize) => void;
  onMove: (direction: "up" | "down") => void;
  onHide: () => void;
}) {
  const sizeLabel: Record<AdminHomeCardSize, string> = {
    s: labels.sizeSmall,
    m: labels.sizeMedium,
    l: labels.sizeLarge,
    full: labels.sizeRow,
  };
  const reason = lockCopy(id, labels);
  const reasonId = reason ? `admin-home-size-lock-${id}` : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={labels.sizeSection} className="flex flex-col gap-1">
        <p className="px-2 text-sm font-semibold text-[var(--color-foreground)]">{labels.sizeSection}</p>
        {SIZES.map((size) => {
          const selected = currentSize === size;
          const allowed = adminHomeSizeAllowed(id, size);
          return (
            <button
              key={size}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              aria-describedby={allowed ? undefined : reasonId}
              disabled={!allowed}
              className={`${rowClass} ${
                selected ? "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))]" : ""
              }`}
              onClick={() => onSize(size)}
            >
              <SizeBar size={size} selected={selected} locked={!allowed} />
              <span className="min-w-0 flex-1 font-medium">{sizeLabel[size]}</span>
              {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
              {allowed ? null : <Lock className="h-4 w-4 shrink-0" aria-hidden />}
            </button>
          );
        })}
        {reason ? (
          <p id={reasonId} className="px-2 text-xs text-[var(--color-muted-foreground)]">
            {reason}
          </p>
        ) : null}
        <p className="px-2 text-xs text-[var(--color-muted-foreground)]">{labels.sizeOnLargeScreen}</p>
      </div>
      <div role="group" aria-label={labels.orderSection} className="flex flex-col gap-1 border-t border-[var(--color-border)] pt-2">
        <p className="px-2 text-sm font-semibold text-[var(--color-foreground)]">{labels.orderSection}</p>
        <button type="button" role="menuitem" className={rowClass} onClick={() => onMove("up")}>
          <ArrowUp className="h-4 w-4 shrink-0" aria-hidden />
          {labels.moveUp}
        </button>
        <button type="button" role="menuitem" className={rowClass} onClick={() => onMove("down")}>
          <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
          {labels.moveDown}
        </button>
      </div>
      <div className="border-t border-[var(--color-border)] pt-2">
        <button type="button" role="menuitem" className={rowClass} onClick={onHide}>
          <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
          {labels.hide}
        </button>
      </div>
    </div>
  );
}
