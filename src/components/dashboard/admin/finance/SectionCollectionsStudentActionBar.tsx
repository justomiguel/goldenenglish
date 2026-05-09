"use client";

import { Bell, Mail, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export interface SectionCollectionsStudentActionBarProps {
  selectionCount: number;
  onClear: () => void;
  onOpenMessageModal: () => void;
  onSendOverdueReminders: () => void;
  overdueBusy: boolean;
  dict: CollectionsDict;
}

export function SectionCollectionsStudentActionBar({
  selectionCount,
  onClear,
  onOpenMessageModal,
  onSendOverdueReminders,
  overdueBusy,
  dict,
}: SectionCollectionsStudentActionBarProps) {
  if (selectionCount === 0) return null;

  return (
    <>
      <span className="text-sm text-[var(--color-muted-foreground)]">
        {dict.matrix.selectionCount.replace("{count}", String(selectionCount))}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={dict.matrix.clearSelection}
        title={dict.matrix.clearSelection}
        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
      <Button type="button" size="md" variant="primary" onClick={onOpenMessageModal}>
        <Mail className="h-4 w-4" aria-hidden />
        {dict.bulk.messageTitle}
      </Button>
      <Button
        type="button"
        size="md"
        variant="secondary"
        isLoading={overdueBusy}
        onClick={onSendOverdueReminders}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {dict.matrix.sendOverdueEmail}
      </Button>
    </>
  );
}
