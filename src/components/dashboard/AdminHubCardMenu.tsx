"use client";

import { useEffect, useRef } from "react";
import { AdminHubCardActions } from "@/components/dashboard/AdminHubCardActions";
import type { AdminHomeCardSize, AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";
import type { Dictionary } from "@/types/i18n";

export function AdminHubCardMenu({
  id,
  title,
  labels,
  currentSize,
  onSize,
  onMove,
  onHide,
  onClose,
}: {
  id: AdminHomeWidgetId;
  labels: Dictionary["admin"]["home"]["layout"];
  title: string;
  currentSize?: AdminHomeCardSize;
  onSize: (size: AdminHomeCardSize) => void;
  onMove: (direction: "up" | "down") => void;
  onHide: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    node?.querySelector<HTMLButtonElement>("button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function onPointer(event: MouseEvent) {
      if (node && !node.contains(event.target as Node)) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute end-0 top-12 z-20 w-72 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]"
    >
      <p className="mb-2 truncate px-2 font-display text-base font-semibold text-[var(--color-primary)]">{title}</p>
      <AdminHubCardActions
        id={id}
        labels={labels}
        currentSize={currentSize}
        onSize={(size) => {
          onSize(size);
          onClose();
        }}
        onMove={(direction) => {
          onMove(direction);
          onClose();
        }}
        onHide={() => {
          onHide();
          onClose();
        }}
      />
    </div>
  );
}
