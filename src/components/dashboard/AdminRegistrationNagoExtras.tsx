import { parseNagoTenantExtras } from "@/lib/register/packs/nago/parseNagoTenantExtras";
import type { Dictionary } from "@/types/i18n";

type RegLabels = Dictionary["admin"]["registrations"];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

export function AdminRegistrationNagoExtras({
  tenantExtras,
  locale,
  labels,
}: {
  tenantExtras: unknown;
  locale: string;
  labels: RegLabels;
}) {
  const extras = parseNagoTenantExtras(tenantExtras);
  if (!extras) return null;
  const empty = labels.emptyValue;
  const text = (value: string) => value.trim() || empty;
  const accepted = extras.protocol.acceptedAt
    ? new Date(extras.protocol.acceptedAt).toLocaleString(locale)
    : empty;

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-semibold">{labels.nagoExtrasTitle}</p>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Field label={labels.nagoNationality} value={text(extras.nationality)} />
        <Field label={labels.nagoAddress} value={text(extras.address)} />
        <Field label={labels.nagoCommune} value={text(extras.commune)} />
        <Field label={labels.nagoSchool} value={text(extras.school)} />
        <Field
          label={labels.nagoInsurance}
          value={text(
            extras.healthInsurance === "other"
              ? extras.healthInsuranceOther
              : extras.healthInsurance,
          )}
        />
        <Field label={labels.nagoBloodType} value={text(extras.bloodType)} />
        <Field
          label={labels.nagoAllergies}
          value={text(extras.hasAllergies ? extras.allergiesDetail : extras.allergiesDetail || empty)}
        />
        <Field
          label={labels.nagoCondition}
          value={text(extras.hasMedicalCondition ? extras.medicalConditionDetail : empty)}
        />
        <Field label={labels.nagoHealthCenter} value={text(extras.preferredHealthCenter)} />
        <Field label={labels.nagoEmergencyName} value={text(extras.emergencyName)} />
        <Field label={labels.nagoEmergencyRelationship} value={text(extras.emergencyRelationship)} />
        <Field label={labels.nagoEmergencyPhone} value={text(extras.emergencyPhone)} />
        <Field label={labels.nagoProtocolVersion} value={text(extras.protocol.version)} />
        <Field label={labels.nagoSignerName} value={text(extras.protocol.signerName)} />
        <Field label={labels.nagoSignerDni} value={text(extras.protocol.signerDni)} />
        <Field label={labels.nagoAcceptedAt} value={accepted} />
      </dl>
    </div>
  );
}
