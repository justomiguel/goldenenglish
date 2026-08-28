"use client";

import { ChevronDown, ChevronRight, Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { RegistrationContactCell } from "@/components/dashboard/RegistrationContactCell";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { RegistrationExistingStudentBadge } from "@/components/dashboard/RegistrationExistingStudentBadge";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";
import { canStartRegistrationEnrollmentFeeFlow } from "@/lib/register/canStartRegistrationEnrollmentFeeFlow";
import { registrationInboxPrimaryKind } from "@/lib/register/registrationInboxPrimaryKind";
import type { RegistrationContactView } from "@/lib/register/resolveRegistrationContact";

type RegLabels = Dictionary["admin"]["registrations"];

export interface AdminRegistrationTableRowProps {
  locale: string;
  r: AdminRegistrationRow;
  busy: boolean;
  labels: RegLabels;
  statusLabel: (status: string) => string;
  contact: RegistrationContactView;
  instituteName: string;
  expanded: boolean;
  onToggleExpanded: (id: string) => void;
  onAccept: (row: AdminRegistrationRow) => void;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
  onMarkContacted: (row: AdminRegistrationRow) => void;
  onRevertToNew: (row: AdminRegistrationRow) => void;
  onStartEnrollmentFee: (row: AdminRegistrationRow) => void;
}

export function AdminRegistrationTableRow({
  locale,
  r,
  busy,
  labels,
  statusLabel,
  contact,
  instituteName,
  expanded,
  onToggleExpanded,
  onAccept,
  onEdit,
  onDelete,
  onMarkContacted,
  onRevertToNew,
  onStartEnrollmentFee,
}: AdminRegistrationTableRowProps) {
  const canAccept = registrationInboxPrimaryKind(r) === "accept";
  const canStartFee = canStartRegistrationEnrollmentFeeFlow(r);
  const isPending = r.status === "new";
  const intakeLabel = r.requestedSectionFull
    ? labels.intake.sectionFull
    : r.intakeState === "receipt_pending"
      ? labels.intake.receiptPending
      : r.intakeState === "needs_section"
        ? labels.intake.needsSection
        : r.intakeState === "section_full"
          ? labels.intake.sectionFull
          : r.intakeState === "awaiting_fee"
            ? labels.intake.awaitingFee.replace("{{amount}}", "")
            : null;

  return (
    <tr
      className={
        r.requestedSectionFull
          ? "border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]"
          : "border-t border-[var(--color-border)]"
      }
      aria-label={r.requestedSectionFull ? labels.requestedSectionFullAria : undefined}
    >
      <td className="px-2 py-2 align-top">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-label={expanded ? labels.collapseRow : labels.expandRow}
          title={expanded ? labels.collapseRow : labels.expandRow}
          className="h-8 w-8 shrink-0 p-0"
          onClick={() => onToggleExpanded(r.id)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          )}
        </Button>
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top font-medium">
        {formatProfileNameSurnameFirst(r.first_name, r.last_name)}
        {r.existingStudentId ? <RegistrationExistingStudentBadge labels={labels} /> : null}
        {contact.isMinor ? (
          <span className="ml-2 whitespace-nowrap rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs font-normal text-[var(--color-muted-foreground)]">
            {labels.minorMarker}
          </span>
        ) : null}
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top">{r.dni}</td>
      <td className="min-w-0 max-w-0 px-3 py-2 align-top">
        <RegistrationContactCell
          entry={contact.student}
          contactName={r.first_name}
          instituteName={instituteName}
          labels={labels}
        />
      </td>
      <td className="min-w-0 max-w-0 px-3 py-2 align-top">
        <RegistrationContactCell
          entry={contact.tutor}
          contactName={r.tutor_name ?? r.first_name}
          instituteName={instituteName}
          labels={labels}
        />
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top">
        {formatRegistrationLevelInterestDisplay(labels, r.level_interest)}
        {r.sourceSectionLinkId ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
            {labels.viaSectionLink}
          </span>
        ) : null}
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top">
        <span className="block">{statusLabel(r.status)}</span>
        {intakeLabel ? (
          <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
            {intakeLabel}
          </span>
        ) : null}
        <button
          type="button"
          className="mt-1 text-xs underline decoration-dotted underline-offset-2 hover:no-underline disabled:opacity-50"
          title={isPending ? labels.markContactedTip : labels.revertToNewTip}
          disabled={busy}
          onClick={() => (isPending ? onMarkContacted(r) : onRevertToNew(r))}
        >
          {isPending ? labels.markContacted : labels.revertToNew}
        </button>
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top text-[var(--color-muted-foreground)]">
        {r.created_at ? new Date(r.created_at).toLocaleString(locale) : labels.emptyValue}
      </td>
      <td className="min-w-0 px-3 py-2 align-top">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canStartFee ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              title={labels.startEnrollmentFeeFlowTip}
              className="min-h-9 max-w-full whitespace-normal text-left"
              disabled={busy}
              onClick={() => onStartEnrollmentFee(r)}
            >
              {labels.startEnrollmentFeeFlow}
            </Button>
          ) : null}
          {canAccept ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={labels.accept}
                title={labels.tipAccept}
                className="h-9 w-9 shrink-0 p-0"
                disabled={busy}
                onClick={() => onAccept(r)}
              >
                <UserPlus
                  className="h-4 w-4 shrink-0 text-[var(--color-secondary-foreground)]"
                  strokeWidth={2}
                  aria-hidden
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={labels.editTitle}
                title={labels.tipEditRow}
                className="h-9 w-9 shrink-0 border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                disabled={busy}
                onClick={() => onEdit(r)}
              >
                <Pencil className="h-4 w-4 shrink-0 text-[var(--color-foreground)]" strokeWidth={2} aria-hidden />
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={labels.delete}
            title={labels.tipDeleteRow}
            className="h-9 w-9 shrink-0 border border-[var(--color-error)] bg-[var(--color-surface)] p-0 text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,var(--color-surface))] hover:text-[var(--color-error)] focus-visible:ring-2 focus-visible:ring-[var(--color-error)]"
            disabled={busy}
            onClick={() => onDelete(r)}
          >
            <Trash2
              className="h-4 w-4 shrink-0 text-[var(--color-error)]"
              strokeWidth={2}
              aria-hidden
            />
          </Button>
        </div>
      </td>
    </tr>
  );
}
