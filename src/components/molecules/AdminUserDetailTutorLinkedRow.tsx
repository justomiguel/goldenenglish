"use client";

import Link from "next/link";
import { ChevronRight, UserMinus } from "lucide-react";
import type { AdminUserTutorLinkVM } from "@/lib/dashboard/adminUserDetailVM";
import { Button } from "@/components/atoms/Button";

export interface AdminUserDetailTutorLinkedRowProps {
  locale: string;
  tutor: AdminUserTutorLinkVM;
  /** Display line under email — use `formatAdminTutorRelationshipLabel` from `AdminUserDetailTutorRelationshipSelect`. */
  relationshipLabel: string;
  openProfileLabel: string;
  editable: boolean;
  rowBusy: boolean;
  unlinkLabel: string;
  unlinkAriaLabel: string;
  onRequestUnlink: () => void;
}

export function AdminUserDetailTutorLinkedRow({
  locale,
  tutor,
  relationshipLabel,
  openProfileLabel,
  editable,
  rowBusy,
  unlinkLabel,
  unlinkAriaLabel,
  onRequestUnlink,
}: AdminUserDetailTutorLinkedRowProps) {
  const profileHref = `/${locale}/dashboard/admin/users/${tutor.tutorId}`;
  const openProfileAriaLabel = `${openProfileLabel}: ${tutor.displayName}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <div className="font-medium text-[var(--color-foreground)]">{tutor.displayName}</div>
          <span
            className="inline-flex max-w-full shrink-0 items-center truncate rounded-full border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]"
            title={relationshipLabel}
          >
            <span className="truncate">{relationshipLabel}</span>
          </span>
        </div>
        <div className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">{tutor.emailDisplay}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={profileHref}
          aria-label={openProfileAriaLabel}
          className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]/40"
        >
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          {openProfileLabel}
        </Link>
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
      </div>
    </li>
  );
}
