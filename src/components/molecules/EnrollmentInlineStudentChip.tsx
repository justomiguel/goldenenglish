"use client";

import { User, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";

export interface EnrollmentInlineStudentChipProps {
  label: string;
  dismissAriaLabel: string;
  onDismiss: () => void;
  disabled?: boolean;
}

export function EnrollmentInlineStudentChip({
  label,
  dismissAriaLabel,
  onDismiss,
  disabled,
}: EnrollmentInlineStudentChipProps) {
  return (
    <div className="inline-flex max-w-full min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-surface)] py-1 pl-3 pr-1 text-sm font-semibold text-[var(--color-foreground)] shadow-sm">
      <User className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
      <span className="min-w-0 max-w-[min(18rem,calc(100vw-10rem))] truncate">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 min-h-9 w-9 min-w-9 shrink-0 rounded-full p-0 hover:bg-[var(--color-muted)]"
        disabled={disabled}
        aria-label={dismissAriaLabel}
        onClick={onDismiss}
      >
        <X className="h-4 w-4 shrink-0" aria-hidden />
      </Button>
    </div>
  );
}
