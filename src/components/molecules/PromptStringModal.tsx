"use client";

import { useEffect, useId, useState } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

export interface PromptStringModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fieldLabel: string;
  initialValue: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: (value: string) => void;
}

export function PromptStringModal({
  open,
  onOpenChange,
  title,
  description,
  fieldLabel,
  initialValue,
  cancelLabel,
  confirmLabel,
  onConfirm,
}: PromptStringModalProps) {
  const titleId = useId();
  const descBlockId = useId();
  const fieldId = useId();
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => setDraft(initialValue));
  }, [open, initialValue]);

  const hasDesc = Boolean(description);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={hasDesc ? descBlockId : undefined}
      title={title}
      closeLabel={cancelLabel}
    >
      {hasDesc ? (
        <p id={descBlockId} className="text-sm text-[var(--color-muted-foreground)]">
          {description}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor={fieldId}>{fieldLabel}</Label>
        <Input
          id={fieldId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            onConfirm(draft);
            onOpenChange(false);
          }}
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
