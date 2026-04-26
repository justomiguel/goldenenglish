"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";

export interface AcademicSectionHealthChartHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Paragraphs separated by `\n\n` (blank lines). */
  body: string;
  closeLabel: string;
}

export function AcademicSectionHealthChartHelpModal({
  open,
  onOpenChange,
  title,
  body,
  closeLabel,
}: AcademicSectionHealthChartHelpModalProps) {
  const titleId = useId();
  const descId = useId();
  const paragraphs = body.split(/\n\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descId}
      title={title}
      dialogClassName="max-w-lg"
    >
      <div id={descId} className="space-y-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="primary" onClick={() => onOpenChange(false)}>
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {closeLabel}
        </Button>
      </div>
    </Modal>
  );
}
