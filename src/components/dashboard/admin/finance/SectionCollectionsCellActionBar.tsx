"use client";

import { Check, GraduationCap, MinusCircle, Undo2, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { SectionCollectionsCellSelectionMode } from "@/lib/billing/sectionCollectionsCellActionability";
import type { Dictionary } from "@/types/i18n";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export type SectionCellBulkAction = "paid" | "scholarship" | "exempt" | "revert";

export interface SectionCollectionsCellActionBarProps {
  cellCount: number;
  studentCount: number;
  selectionMode: SectionCollectionsCellSelectionMode | null;
  onClear: () => void;
  onAction: (action: SectionCellBulkAction) => void;
  busy: boolean;
  dict: CollectionsDict;
}

export function SectionCollectionsCellActionBar({
  cellCount,
  studentCount,
  selectionMode,
  onClear,
  onAction,
  busy,
  dict,
}: SectionCollectionsCellActionBarProps) {
  if (cellCount === 0) return null;

  const isRevert = selectionMode === "revert";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-3 py-2">
      <span className="text-sm font-medium text-[var(--color-foreground)]">
        {dict.cellActions.selectedCount
          .replace("{cells}", String(cellCount))
          .replace("{students}", String(studentCount))}
      </span>
      {isRevert ? (
        <span className="text-xs text-[var(--color-muted-foreground)]">{dict.cellActions.revertHint}</span>
      ) : null}
      <button
        type="button"
        onClick={onClear}
        aria-label={dict.matrix.clearSelection}
        title={dict.matrix.clearSelection}
        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {isRevert ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            isLoading={busy}
            onClick={() => onAction("revert")}
          >
            <Undo2 className="h-4 w-4" aria-hidden />
            {dict.cellActions.markUnpaid}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="primary"
              isLoading={busy}
              onClick={() => onAction("paid")}
            >
              <Check className="h-4 w-4" aria-hidden />
              {dict.cellActions.markPaid}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              isLoading={busy}
              onClick={() => onAction("scholarship")}
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
              {dict.cellActions.applyScholarship}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isLoading={busy}
              onClick={() => onAction("exempt")}
            >
              <MinusCircle className="h-4 w-4" aria-hidden />
              {dict.cellActions.markExempt}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
