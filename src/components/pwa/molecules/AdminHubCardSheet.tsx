"use client";

import { Modal } from "@/components/atoms/Modal";
import { AdminHubCardActions } from "@/components/dashboard/AdminHubCardActions";
import type { AdminHomeCardSize, AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";
import type { Dictionary } from "@/types/i18n";

export function AdminHubCardSheet({
  id,
  title,
  labels,
  open,
  onOpenChange,
  currentSize,
  onSize,
  onMove,
  onHide,
}: {
  id: AdminHomeWidgetId;
  title: string;
  labels: Dictionary["admin"]["home"]["layout"];
  currentSize?: AdminHomeCardSize;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSize: (size: AdminHomeCardSize) => void;
  onMove: (direction: "up" | "down") => void;
  onHide: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="admin-hub-card-sheet-title"
      title={title}
      dialogClassName="!top-auto !bottom-0 !left-0 !right-0 !w-full !max-w-none !translate-x-0 !translate-y-0 rounded-b-none"
    >
      <AdminHubCardActions
        id={id}
        labels={labels}
        currentSize={currentSize}
        onSize={(size) => {
          onSize(size);
          onOpenChange(false);
        }}
        onMove={(direction) => {
          onMove(direction);
          onOpenChange(false);
        }}
        onHide={() => {
          onHide();
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}
