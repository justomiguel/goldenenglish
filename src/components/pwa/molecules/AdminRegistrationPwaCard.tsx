"use client";

import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { RegistrationContactCell } from "@/components/dashboard/RegistrationContactCell";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { RegistrationExistingStudentBadge } from "@/components/dashboard/RegistrationExistingStudentBadge";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { formatCivilIsoDateForDisplay } from "@/lib/calendar/civilGregorianDate";
import { canStartRegistrationEnrollmentFeeFlow } from "@/lib/register/canStartRegistrationEnrollmentFeeFlow";
import { registrationInboxPrimaryKind } from "@/lib/register/registrationInboxPrimaryKind";
import { AdminRegistrationIntakeActions } from "@/components/dashboard/AdminRegistrationIntakeActions";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import { AdminRegistrationNagoExtras } from "@/components/dashboard/AdminRegistrationNagoExtras";
import type { RegistrationContactView } from "@/lib/register/resolveRegistrationContact";

type RegLabels = Dictionary["admin"]["registrations"];

export interface AdminRegistrationPwaCardProps {
  locale: string;
  r: AdminRegistrationRow;
  busy: boolean;
  labels: RegLabels;
  statusLabel: (status: string) => string;
  contact: RegistrationContactView;
  instituteName: string;
  onAccept: (row: AdminRegistrationRow) => void;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
  onMarkContacted: (row: AdminRegistrationRow) => void;
  onRevertToNew: (row: AdminRegistrationRow) => void;
  onStartEnrollmentFee: (row: AdminRegistrationRow) => void;
  currentCohortSections?: CurrentCohortSection[];
  onBusy?: (id: string | null) => void;
  onIntakeDone?: () => void;
}

export function AdminRegistrationPwaCard({
  locale,
  r,
  busy,
  labels,
  statusLabel,
  contact,
  instituteName,
  onAccept,
  onEdit,
  onDelete,
  onMarkContacted,
  onRevertToNew,
  onStartEnrollmentFee,
  currentCohortSections,
  onBusy,
  onIntakeDone,
}: AdminRegistrationPwaCardProps) {
  const canAccept = registrationInboxPrimaryKind(r) === "accept";
  const canStartFee = canStartRegistrationEnrollmentFeeFlow(r);
  const isPending = r.status === "new";
  const birthDisplay =
    formatCivilIsoDateForDisplay(locale, r.birth_date, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) ?? labels.emptyValue;
  const receivedDisplay = r.created_at
    ? new Date(r.created_at).toLocaleString(locale)
    : labels.emptyValue;

  const deleteBtnClass =
    "min-h-[44px] border-2 border-[var(--color-error)] bg-[var(--color-surface)] p-0 text-[var(--color-error)] shadow-sm hover:bg-[color-mix(in_srgb,var(--color-error)_10%,var(--color-surface))] hover:text-[var(--color-error)] focus-visible:ring-2 focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";

  return (
    <li
      className={
        r.requestedSectionFull
          ? "rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_12%,var(--color-background))] p-3 shadow-sm"
          : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-sm"
      }
      aria-label={r.requestedSectionFull ? labels.requestedSectionFullAria : undefined}
    >
      <div className="space-y-2">
        <p className="break-words font-medium text-[var(--color-foreground)]">
          {formatProfileNameSurnameFirst(r.first_name, r.last_name)}
          {r.existingStudentId ? <RegistrationExistingStudentBadge labels={labels} /> : null}
          {contact.isMinor ? (
            <span className="ml-2 whitespace-nowrap rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs font-normal text-[var(--color-muted-foreground)]">
              {labels.minorMarker}
            </span>
          ) : null}
        </p>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {labels.phoneStudent}
            </p>
            <RegistrationContactCell
              entry={contact.student}
              contactName={r.first_name}
              instituteName={instituteName}
              labels={labels}
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {labels.phoneTutor}
            </p>
            <RegistrationContactCell
              entry={contact.tutor}
              contactName={r.tutor_name ?? r.first_name}
              instituteName={instituteName}
              labels={labels}
            />
          </div>
        </div>
        <dl className="grid gap-1 text-sm text-[var(--color-muted-foreground)]">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="sr-only">{labels.email}</dt>
            <dd className="break-all">{r.email}</dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <span>
              <span className="text-[var(--color-foreground)]">{labels.dni}: </span>
              {r.dni}
            </span>
            <span>
              <span className="text-[var(--color-foreground)]">{labels.level}: </span>
              {formatRegistrationLevelInterestDisplay(labels, r.level_interest)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <span>
              <span className="text-[var(--color-foreground)]">{labels.birthDate}: </span>
              {birthDisplay}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <span>
              <span className="text-[var(--color-foreground)]">{labels.status}: </span>
              {r.status === "new" ? (
                <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[0.7rem] font-bold text-[var(--color-accent-foreground)]">
                  {labels.new}
                </span>
              ) : (
                statusLabel(r.status)
              )}
            </span>
            <span>
              <span className="text-[var(--color-foreground)]">{labels.received}: </span>
              {receivedDisplay}
            </span>
          </div>
        </dl>
        <AdminRegistrationNagoExtras
          tenantExtras={r.tenantExtras}
          locale={locale}
          labels={labels}
        />
        {onBusy && onIntakeDone ? (
          <AdminRegistrationIntakeActions
            locale={locale}
            row={r}
            labels={labels.intake}
            sections={currentCohortSections ?? []}
            busy={busy}
            onBusy={onBusy}
            onDone={onIntakeDone}
          />
        ) : null}
        <button
          type="button"
          className="min-h-[44px] text-sm underline decoration-dotted underline-offset-2 disabled:opacity-50"
          title={isPending ? labels.markContactedTip : labels.revertToNewTip}
          disabled={busy}
          onClick={() => (isPending ? onMarkContacted(r) : onRevertToNew(r))}
        >
          {isPending ? labels.markContacted : labels.revertToNew}
        </button>
        {canStartFee ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-[44px] w-full"
            title={labels.startEnrollmentFeeFlowTip}
            disabled={busy}
            onClick={() => onStartEnrollmentFee(r)}
          >
            {labels.startEnrollmentFeeFlow}
          </Button>
        ) : null}
        <div
          className={
            canAccept
              ? "grid w-full min-w-0 grid-cols-3 gap-2 pt-2"
              : "flex justify-end pt-2"
          }
        >
          {canAccept ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={labels.accept}
                title={labels.tipAccept}
                className="min-h-[44px] w-full border border-[color-mix(in_srgb,var(--color-secondary-foreground)_22%,transparent)] px-0"
                disabled={busy}
                onClick={() => onAccept(r)}
              >
                <UserPlus
                  className="h-4 w-4 shrink-0 text-[var(--color-secondary-foreground)]"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={labels.editTitle}
                title={labels.tipEditRow}
                className="min-h-[44px] w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-0 hover:bg-[var(--color-muted)]"
                disabled={busy}
                onClick={() => onEdit(r)}
              >
                <Pencil className="h-4 w-4 shrink-0 text-[var(--color-foreground)]" strokeWidth={2.25} aria-hidden />
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={labels.delete}
            title={labels.tipDeleteRow}
            className={`${deleteBtnClass} ${canAccept ? "w-full" : "min-w-[44px] shrink-0"}`}
            disabled={busy}
            onClick={() => onDelete(r)}
          >
            <Trash2 className="h-4 w-4 shrink-0 text-[var(--color-error)]" strokeWidth={2.25} aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}
