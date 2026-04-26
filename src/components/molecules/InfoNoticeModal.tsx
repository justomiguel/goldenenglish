"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";

export interface InfoNoticeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  closeLabel: string;
}

export function InfoNoticeModal({
  open,
  onOpenChange,
  title,
  message,
  closeLabel,
}: InfoNoticeModalProps) {
  const titleId = useId();
  const descId = useId();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descId}
      title={title}
    >
      <p id={descId} className="text-sm text-[var(--color-muted-foreground)]">
        {message}
      </p>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="primary" onClick={() => onOpenChange(false)}>
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {closeLabel}
        </Button>
      </div>
    </Modal>
  );
}
