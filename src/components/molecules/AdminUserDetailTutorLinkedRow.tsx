"use client";

import { UserMinus } from "lucide-react";
import type { AdminUserTutorLinkVM } from "@/lib/dashboard/adminUserDetailVM";
import { Button } from "@/components/atoms/Button";

export interface AdminUserDetailTutorLinkedRowProps {
  tutor: AdminUserTutorLinkVM;
  editable: boolean;
  rowBusy: boolean;
  unlinkLabel: string;
  unlinkAriaLabel: string;
  onRequestUnlink: () => void;
}

export function AdminUserDetailTutorLinkedRow({
  tutor,
  editable,
  rowBusy,
  unlinkLabel,
  unlinkAriaLabel,
  onRequestUnlink,
}: AdminUserDetailTutorLinkedRowProps) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-[var(--color-foreground)]">{tutor.displayName}</div>
        <div className="text-xs text-[var(--color-muted-foreground)]">{tutor.emailDisplay}</div>
      </div>
      {editable ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-[36px] shrink-0 border border-[var(--color-error)]/50 text-[var(--color-error)] hover:bg-[var(--color-muted)]"
          disabled={rowBusy}
          aria-label={unlinkAriaLabel}
          onClick={onRequestUnlink}
        >
          <UserMinus className="h-4 w-4 shrink-0" aria-hidden />
          {unlinkLabel}
        </Button>
      ) : null}
    </li>
  );
}
