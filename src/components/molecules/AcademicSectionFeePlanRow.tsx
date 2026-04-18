"use client";

import { Archive, ArchiveRestore, Copy, Pencil, Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { SectionFeePlan, SectionFeePlanWithUsage } from "@/types/sectionFeePlan";
import { Button } from "@/components/atoms/Button";

type FeePlansDict = Dictionary["dashboard"]["academicSectionPage"]["feePlans"];

export interface AcademicSectionFeePlanRowProps {
  plan: SectionFeePlanWithUsage;
  dict: FeePlansDict;
  pending: boolean;
  onEdit: (plan: SectionFeePlanWithUsage) => void;
  onDuplicate: (plan: SectionFeePlanWithUsage) => void;
  onArchive: (plan: SectionFeePlanWithUsage) => void;
  onRestore: (plan: SectionFeePlanWithUsage) => void;
  onDelete: (plan: SectionFeePlanWithUsage) => void;
}

export function formatSectionFeePlanLabel(p: SectionFeePlan, dict: FeePlansDict): string {
  const eff = `${String(p.effectiveFromMonth).padStart(2, "0")}/${p.effectiveFromYear}`;
  const period = `${String(p.periodStartMonth).padStart(2, "0")}/${p.periodStartYear}`;
  const matricula = p.chargesEnrollmentFee ? dict.matriculaYes : dict.matriculaNo;
  return `${dict.effectiveFromShort} ${eff} · $${p.monthlyFee} · ${p.paymentsCount} ${dict.paymentsShort} · ${matricula} · ${dict.periodStartShort} ${period}`;
}

export function AcademicSectionFeePlanRow({
  plan,
  dict,
  pending,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}: AcademicSectionFeePlanRowProps) {
  const isArchived = Boolean(plan.archivedAt);
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 ${isArchived ? "opacity-60" : ""}`}
    >
      <div className="min-w-0">
        <p className="text-sm text-[var(--color-foreground)]">
          {formatSectionFeePlanLabel(plan, dict)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          {plan.inUse ? (
            <span
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-[var(--color-foreground)]"
              title={dict.inUseBadgeTitle}
            >
              {dict.inUseBadge}
            </span>
          ) : null}
          {isArchived ? (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-[var(--color-muted-foreground)]">
              {dict.archivedBadge}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!isArchived ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onEdit(plan)}
              aria-label={dict.editAria}
              title={dict.edit}
              className="min-h-[44px] min-w-[44px]"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Button>
            {plan.inUse ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onDuplicate(plan)}
                disabled={pending}
                aria-label={dict.duplicateVersionAria}
                title={dict.duplicateVersion}
                className="min-h-[44px] min-w-[44px]"
              >
                <Copy className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            {plan.inUse ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onArchive(plan)}
                disabled={pending}
                aria-label={dict.archiveAria}
                title={dict.archive}
                className="min-h-[44px] min-w-[44px]"
              >
                <Archive className="h-4 w-4" aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onDelete(plan)}
                disabled={pending}
                aria-label={dict.deleteAria}
                title={dict.delete}
                className="min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onRestore(plan)}
              disabled={pending}
              aria-label={dict.restoreAria}
              title={dict.restore}
              className="min-h-[44px] min-w-[44px]"
            >
              <ArchiveRestore className="h-4 w-4" aria-hidden />
            </Button>
            {!plan.inUse ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onDelete(plan)}
                disabled={pending}
                aria-label={dict.deleteAria}
                title={dict.delete}
                className="min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
