"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { AdminHomeCardSize, AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";
import { adminHomeSizeFromWidth, stepAdminHomeSize } from "@/lib/dashboard/adminHomeSizeSnap";

const RANK: Record<AdminHomeCardSize, number> = { s: 0, m: 1, l: 2, full: 3 };

export function AdminHubCardResizeHandle({
  id,
  currentSize,
  label,
  valueText,
  onSize,
}: {
  id: AdminHomeWidgetId;
  currentSize: AdminHomeCardSize;
  label: string;
  valueText: string;
  onSize: (size: AdminHomeCardSize) => void;
}) {
  const lastRef = useRef(currentSize);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    lastRef.current = currentSize;
  }, [currentSize]);

  useEffect(() => () => stopRef.current?.(), []);

  function emit(next: AdminHomeCardSize) {
    if (next === lastRef.current) return;
    lastRef.current = next;
    onSize(next);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    try {
      handle.setPointerCapture(event.pointerId);
    } catch {
      // jsdom does not implement pointer capture.
    }
    stopRef.current?.();
    const apply = (clientX: number) => {
      const slot = handle.closest("[data-admin-home-slot]");
      const grid = handle.closest("[data-admin-home-grid]");
      if (!slot || !grid) return;
      const gridBox = grid.getBoundingClientRect();
      const slotBox = slot.getBoundingClientRect();
      const rtl = getComputedStyle(slot).direction === "rtl";
      const width = rtl ? slotBox.right - clientX : clientX - slotBox.left;
      emit(adminHomeSizeFromWidth(id, width, gridBox.width));
    };
    const move = (ev: PointerEvent) => apply(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      stopRef.current = null;
    };
    stopRef.current = up;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    emit(stepAdminHomeSize(id, currentSize, direction));
  }

  const min = stepAdminHomeSize(id, "s", -1);

  return (
    <button
      type="button"
      role="slider"
      aria-label={label}
      title={label}
      aria-orientation="horizontal"
      aria-valuemin={RANK[min]}
      aria-valuemax={RANK.full}
      aria-valuenow={RANK[currentSize]}
      aria-valuetext={valueText}
      className="absolute inset-y-0 end-0 z-20 hidden w-11 cursor-col-resize touch-none items-center justify-center ltr:translate-x-1/2 rtl:-translate-x-1/2 lg:flex"
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <span className="h-14 w-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden />
    </button>
  );
}
