import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { formatRegistrationLevelInterestForAdmin } from "@/lib/register/formatRegistrationLevelInterestForAdmin";

export interface AdminRegistrationAcceptSummaryProps {
  locale: string;
  row: AdminRegistrationRow;
  labels: Dictionary["admin"]["registrations"];
  hasBirth: boolean;
  treatsAsMinor: boolean;
  showTutorBlock: boolean;
}

export function AdminRegistrationAcceptSummary({
  locale,
  row,
  labels,
  hasBirth,
  treatsAsMinor,
  showTutorBlock,
}: AdminRegistrationAcceptSummaryProps) {
  return (
    <>
      <dl className="grid gap-1 text-sm">
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.name}</dt>
          <dd className="font-medium">
            {formatProfileNameSurnameFirst(row.first_name, row.last_name)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.email}</dt>
          <dd>{row.email}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.dni}</dt>
          <dd>{row.dni}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.acceptApplicantPreferenceLabel}</dt>
          <dd className="font-medium">
            {formatRegistrationLevelInterestForAdmin(row.level_interest, labels)}
          </dd>
        </div>
        {hasBirth ? (
          <div>
            <dt className="text-[var(--color-muted-foreground)]">{labels.birthDate}</dt>
            <dd>
              {new Date(`${row.birth_date!.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </dd>
          </div>
        ) : null}
      </dl>

      {treatsAsMinor ? (
        <p className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-2 text-xs text-[var(--color-foreground)]">
          {labels.acceptMinorHint}
        </p>
      ) : null}

      {showTutorBlock ? (
        <div className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2 text-sm">
          <p className="font-semibold text-[var(--color-secondary)]">{labels.tutorOnRequestTitle}</p>
          <dl className="mt-2 grid gap-1 text-xs">
            <div>
              <dt className="text-[var(--color-muted-foreground)]">{labels.tutorOnRequestName}</dt>
              <dd>{row.tutor_name?.trim() || labels.emptyValue}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">{labels.tutorOnRequestDni}</dt>
              <dd>{row.tutor_dni?.trim() || labels.emptyValue}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">{labels.tutorOnRequestEmail}</dt>
              <dd>{row.tutor_email?.trim() || labels.emptyValue}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">
                {labels.tutorOnRequestRelationship}
              </dt>
              <dd>{row.tutor_relationship?.trim() || labels.emptyValue}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </>
  );
}
