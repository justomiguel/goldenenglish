"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { AdminHomeCardSize, AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";
import { AdminHubCardResizeHandle } from "@/components/dashboard/AdminHubCardResizeHandle";

const SPAN: Record<AdminHomeCardSize, string> = {
  s: "lg:col-span-4",
  m: "lg:col-span-6",
  l: "lg:col-span-8",
  full: "lg:col-span-12",
};

export function AdminHubHomeSlot({
  id,
  size,
  label,
  menuLabel,
  editing,
  sortable,
  menu,
  resizeLabel,
  resizeValueText,
  children,
  onOpenMenu,
  onResize,
}: {
  id: AdminHomeWidgetId;
  size: AdminHomeCardSize;
  label: string;
  menuLabel: string;
  editing: boolean;
  sortable: boolean;
  menu: ReactNode;
  resizeLabel: string;
  resizeValueText: string;
  children: ReactNode;
  onOpenMenu: () => void;
  onResize: (size: AdminHomeCardSize) => void;
}) {
  const moreRef = useRef<HTMLButtonElement>(null);
  const menuWasOpen = useRef(false);
  useEffect(() => {
    if (menuWasOpen.current && !menu) moreRef.current?.focus();
    menuWasOpen.current = Boolean(menu);
  }, [menu]);
  const sortableState = useSortable({ id, disabled: !sortable });
  const style = sortable
    ? {
        transform: CSS.Transform.toString(sortableState.transform),
        transition: sortableState.transition,
      }
    : undefined;

  return (
    <div
      ref={sortable ? sortableState.setNodeRef : undefined}
      style={style}
      className={`relative min-w-0 ${SPAN[size]} ${editing ? "[&_a]:pointer-events-none" : ""}`}
      data-admin-home-slot=""
      onContextMenu={
        editing && sortable
          ? (event) => {
              event.preventDefault();
              onOpenMenu();
            }
          : undefined
      }
    >
      {editing ? (
        <div className="absolute end-2 top-2 z-10 flex gap-1">
          {sortable ? (
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
              aria-label={label}
              {...sortableState.attributes}
              {...sortableState.listeners}
            >
              <GripVertical className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            ref={moreRef}
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
            aria-label={menuLabel}
            onClick={onOpenMenu}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
      {menu}
      {editing && sortable ? (
        <AdminHubCardResizeHandle
          id={id}
          currentSize={size}
          label={resizeLabel}
          valueText={resizeValueText}
          onSize={onResize}
        />
      ) : null}
      {children}
    </div>
  );
}
