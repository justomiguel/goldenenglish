"use client";

import Link from "next/link";
import { ChevronRight, UserMinus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { AdminUserTutorFamilyStudentVM } from "@/lib/dashboard/adminUserDetailVM";
import type { Dictionary } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailTutorFamilyStudentRowProps {
  locale: string;
  student: AdminUserTutorFamilyStudentVM;
  /** Relationship line — use `formatAdminTutorRelationshipLabel`. */
  relationshipLabel: string;
  labels: UserLabels;
  editable: boolean;
  rowBusyGlobal: boolean;
  onRequestUnlink: () => void;
}

export function AdminUserDetailTutorFamilyStudentRow({
  locale,
  student,
  relationshipLabel,
  labels,
  editable,
  rowBusyGlobal,
  onRequestUnlink,
}: AdminUserDetailTutorFamilyStudentRowProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-[var(--color-foreground)]">{student.displayName}</div>
        <div className="text-xs text-[var(--color-muted-foreground)]">{student.emailDisplay}</div>
        <div className="text-xs text-[var(--color-muted-foreground)]">{relationshipLabel}</div>
        {!student.financialAccessActive ? (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.detailTutorFamilyFinancialRevokedBadge}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/${locale}/dashboard/admin/users/${student.studentId}`}
          className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]/40"
        >
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          {labels.detailTutorFamilyOpenStudentProfile}
        </Link>
        {editable ? (
          <Button type="button" variant="secondary" size="sm" disabled={rowBusyGlobal} onClick={onRequestUnlink}>
            <UserMinus className="h-4 w-4 shrink-0" aria-hidden />
            {labels.detailTutorFamilyUnlinkStudent}
          </Button>
        ) : null}
      </div>
    </li>
  );
}
