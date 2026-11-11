"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { AdminRegistrationFunnelPanel } from "@/components/dashboard/AdminRegistrationFunnelPanel";
import { RegistrationContactCell } from "@/components/dashboard/RegistrationContactCell";
import { AdminUserNameLink } from "@/components/molecules/AdminUserNameLink";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { RegistrationExistingStudentBadge } from "@/components/dashboard/RegistrationExistingStudentBadge";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";
import { formatRegistrationIntakeLabel } from "@/lib/register/formatRegistrationIntakeLabel";
import { cohortSectionChoices } from "@/lib/register/registrationMatriculaAlta";
import type { RegistrationSectionPickerOption } from "@/lib/register/registrationSectionPicker";
import { registrationIntentLabel } from "@/lib/register/registrationIntentLabel";
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
  onStartJoinCharge: (row: AdminRegistrationRow) => void;
  sectionOptionsByCohort?: Record<string, RegistrationSectionPickerOption[]>;
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
  onAccept: _onAccept,
  onEdit,
  onDelete,
  onMarkContacted,
  onRevertToNew: _onRevertToNew,
  onStartEnrollmentFee,
  onStartJoinCharge: _onStartJoinCharge,
  sectionOptionsByCohort,
}: AdminRegistrationTableRowProps) {
  void _onAccept;
  void _onRevertToNew;
  void _onStartJoinCharge;
  const [actionsOpen, setActionsOpen] = useState(false);
  const intakeLabel = formatRegistrationIntakeLabel({
    intakeState: r.intakeState,
    requestedSectionFull: r.requestedSectionFull,
    snapshotTotal: r.snapshotTotal,
    snapshotCurrency: r.snapshotCurrency,
    feeSnapshot: r.feeSnapshot,
    locale,
    labels: labels.intake,
  });

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
          className="h-11 w-11 shrink-0 p-0 md:h-8 md:w-8"
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
        {r.existingStudentId ? (
          <AdminUserNameLink
            locale={locale}
            userId={r.existingStudentId}
            name={formatProfileNameSurnameFirst(r.first_name, r.last_name)}
          />
        ) : (
          formatProfileNameSurnameFirst(r.first_name, r.last_name)
        )}
        {r.existingStudentId ? <RegistrationExistingStudentBadge labels={labels} /> : null}
        {contact.isMinor ? (
          <span className="ml-2 whitespace-nowrap rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs font-normal text-[var(--color-muted-foreground)]">
            {labels.minorMarker}
          </span>
        ) : null}
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top">
        {registrationIntentLabel(labels, r.intent)}
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
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top text-[var(--color-muted-foreground)]">
        {r.created_at ? new Date(r.created_at).toLocaleString(locale) : labels.emptyValue}
      </td>
      <td className="min-w-0 px-3 py-2 align-top">
        <Button type="button" variant="secondary" size="sm" className="min-h-11" onClick={() => setActionsOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {labels.funnel.actions}
        </Button>
        <Modal open={actionsOpen} onOpenChange={setActionsOpen} titleId={`reg-actions-${r.id}`} title={labels.funnel.actions}>
          <AdminRegistrationFunnelPanel
            locale={locale}
            row={r}
            labels={labels}
            busy={busy}
            sections={cohortSectionChoices(r.preferredSectionCohortId, sectionOptionsByCohort)}
            contact={contact}
            onStartEnrollmentFee={onStartEnrollmentFee}
            onMarkContacted={onMarkContacted}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={() => setActionsOpen(false)}
          />
        </Modal>
      </td>
    </tr>
  );
}
