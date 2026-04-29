"use client";

import { Bell, Mail, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type ActionBarDict = Dictionary["admin"]["finance"]["collections"]["actionBar"];
type MatrixDict = Dictionary["admin"]["finance"]["collections"]["matrix"];

export interface CollectionsActionBarProps {
  selectionCount: number;
  overdueBusy: boolean;
  onMessage: () => void;
  onRemindOverdue: () => void;
  onClearSelection: () => void;
  actionBarDict: ActionBarDict;
  matrixDict: MatrixDict;
}

export function CollectionsActionBar({
  selectionCount,
  overdueBusy,
  onMessage,
  onRemindOverdue,
  onClearSelection,
  actionBarDict,
  matrixDict,
}: CollectionsActionBarProps) {
  if (selectionCount === 0) return null;

  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 shadow-lg">
      <span className="text-sm text-[var(--color-muted-foreground)]">
        {matrixDict.selectionCount.replace("{count}", String(selectionCount))}
      </span>

      <Button
        type="button"
        size="md"
        variant="primary"
        isLoading={false}
        onClick={onMessage}
      >
        <Mail className="h-4 w-4" aria-hidden />
        {actionBarDict.messageSelected}
      </Button>

      <Button
        type="button"
        size="md"
        variant="secondary"
        isLoading={overdueBusy}
        onClick={onRemindOverdue}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {actionBarDict.remindOverdue}
      </Button>

      <button
        type="button"
        onClick={onClearSelection}
        aria-label={actionBarDict.clearAll}
        title={actionBarDict.clearAll}
        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
