"use client";

import type { ReactNode } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import {
  PULL_TO_REFRESH_THRESHOLD_PX,
  usePullToRefresh,
} from "@/hooks/usePullToRefresh";

export interface PwaPullToRefreshProps {
  children: ReactNode;
  onRefresh: () => void | Promise<void>;
  copy: Dictionary["pwa"]["pullToRefresh"];
  /** Mount the gesture only on the installed app surface. */
  enabled?: boolean;
}

/**
 * Wraps the installed-app scroll area with a native-feeling refresh gesture.
 * The indicator stays out of the layout flow so content never shifts while pulling.
 */
export function PwaPullToRefresh({
  children,
  onRefresh,
  copy,
  enabled = true,
}: PwaPullToRefreshProps) {
  const { distance, phase, ref } = usePullToRefresh({ onRefresh, enabled });
  const active = phase !== "idle";
  const refreshing = phase === "refreshing";
  const offset = refreshing ? PULL_TO_REFRESH_THRESHOLD_PX : distance;

  const statusLabel = refreshing
    ? copy.refreshing
    : phase === "armed"
      ? copy.release
      : copy.pull;

  return (
    <div ref={ref} className="relative">
      <div
        aria-hidden={!active}
        className={`pointer-events-none absolute inset-x-0 top-0 flex justify-center transition-opacity motion-reduce:transition-none ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ transform: `translateY(${Math.max(0, offset - 28)}px)` }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] shadow-[var(--shadow-card)]">
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <ArrowDown
              className={`h-4 w-4 transition-transform motion-reduce:transition-none ${
                phase === "armed" ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          )}
          {statusLabel}
        </span>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {refreshing ? copy.refreshing : ""}
      </div>
      <div
        className={refreshing ? "" : "transition-transform motion-reduce:transition-none"}
        style={{ transform: `translateY(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
