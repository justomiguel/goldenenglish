import { formatCivilIsoDateForDisplay } from "@/lib/calendar/civilGregorianDate";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";
import type { RegistrationContactView } from "@/lib/register/resolveRegistrationContact";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"];

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value?.trim();
  if (!text) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="break-words text-sm text-[var(--color-foreground)]">{text}</dd>
    </div>
  );
}

export function AdminRegistrationPersonCard({
  locale,
  row,
  labels,
  contact,
}: {
  locale: string;
  row: AdminRegistrationRow;
  labels: Labels;
  contact?: RegistrationContactView | null;
}) {
  const name = formatProfileNameSurnameFirst(row.first_name, row.last_name, labels.emptyValue);
  const birth = formatCivilIsoDateForDisplay(locale, row.birth_date, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const level = formatRegistrationLevelInterestDisplay(labels, row.level_interest);
  const levelValue = level === labels.emptyValue ? null : level;
  const tutorPhone = contact?.tutor?.phoneDisplay ?? row.tutor_phone;
  const showTutor = Boolean(
    row.tutor_name?.trim() || row.tutor_relationship?.trim() || tutorPhone?.trim() || row.tutor_email?.trim(),
  );

  return (
    <section data-registration-person className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <h2 className="text-lg font-medium text-[var(--color-foreground)]">{name}</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        <Fact label={labels.dni} value={row.dni} />
        <Fact label={labels.email} value={row.email} />
        <Fact label={labels.phone} value={contact?.student?.phoneDisplay ?? row.phone} />
        <Fact label={labels.birthDate} value={birth} />
        <Fact label={labels.level} value={levelValue} />
      </dl>
      {showTutor ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-3">
          <Fact label={labels.tutorOnRequestName} value={row.tutor_name} />
          <Fact label={labels.tutorOnRequestRelationship} value={row.tutor_relationship} />
          <Fact label={labels.editTutorPhone} value={tutorPhone} />
          <Fact label={labels.tutorOnRequestEmail} value={row.tutor_email} />
        </dl>
      ) : null}
    </section>
  );
}
