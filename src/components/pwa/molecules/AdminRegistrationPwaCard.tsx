"use client";

import { useState } from "react";
import { Check, MessageCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { RegistrationContactCell } from "@/components/dashboard/RegistrationContactCell";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { RegistrationExistingStudentBadge } from "@/components/dashboard/RegistrationExistingStudentBadge";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { formatCivilIsoDateForDisplay } from "@/lib/calendar/civilGregorianDate";
import { AdminRegistrationActionsSheet } from "@/components/pwa/molecules/AdminRegistrationActionsSheet";
import { registrationInboxPrimaryKind } from "@/lib/register/registrationInboxPrimaryKind";
import { registrationIntentLabel } from "@/lib/register/registrationIntentLabel";
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
  onStartJoinCharge: (row: AdminRegistrationRow) => void;
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
  onStartJoinCharge,
  currentCohortSections,
  onBusy,
  onIntakeDone,
}: AdminRegistrationPwaCardProps) {
  const canAccept = registrationInboxPrimaryKind(r) === "accept";
  const [actionsOpen, setActionsOpen] = useState(false);
  const birthDisplay =
    formatCivilIsoDateForDisplay(locale, r.birth_date, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) ?? labels.emptyValue;
  const whatsAppDigits = contact.tutor?.whatsAppDigits ?? contact.student?.whatsAppDigits ?? null;
  const phoneLine = contact.tutor?.phoneDisplay || contact.student?.phoneDisplay || "";
  const displayName = formatProfileNameSurnameFirst(r.first_name, r.last_name);
  const receivedDisplay = r.created_at
    ? new Date(r.created_at).toLocaleString(locale)
    : labels.emptyValue;

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
          {displayName}
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
              <span className="text-[var(--color-foreground)]">{labels.intentColumn}: </span>
              {registrationIntentLabel(labels, r.intent)}
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
            joinBilling={labels.joinBilling}
            sections={currentCohortSections ?? []}
            busy={busy}
            onBusy={onBusy}
            onDone={onIntakeDone}
          />
        ) : null}
        <div className="flex items-center gap-2">
          {whatsAppDigits ? (
            <a
              href={`https://wa.me/${whatsAppDigits}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-foreground)]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {labels.whatsappCta}
            </a>
          ) : null}
          {canAccept ? (
            <Button type="button" className="min-h-11 flex-1" disabled={busy} onClick={() => onAccept(r)}>
              <Check className="h-4 w-4" aria-hidden />
              {labels.accept}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 min-w-11 px-2"
            aria-label={labels.moreActionsAria.replace("{{name}}", displayName)}
            onClick={() => setActionsOpen(true)}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <p className="truncate text-xs text-[var(--color-muted-foreground)]">
          {[formatRegistrationLevelInterestDisplay(labels, r.level_interest), birthDisplay, r.dni]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="truncate text-xs text-[var(--color-muted-foreground)]">
          {[phoneLine, r.email].filter(Boolean).join(" · ")}
        </p>
        <AdminRegistrationActionsSheet
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          row={r}
          busy={busy}
          labels={labels}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkContacted={onMarkContacted}
          onRevertToNew={onRevertToNew}
          onStartEnrollmentFee={onStartEnrollmentFee}
          onStartJoinCharge={onStartJoinCharge}
        />
      </div>
    </li>
  );
}
