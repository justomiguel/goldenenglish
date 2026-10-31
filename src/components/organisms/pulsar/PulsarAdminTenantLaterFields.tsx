import type { Dictionary } from "@/types/i18n";
import type { PulsarTenantFormValues } from "@/components/organisms/pulsar/PulsarAdminTenantFieldGroups";

type LaterFieldKey = Extract<
  keyof PulsarTenantFormValues,
  keyof Dictionary["pulsar"]["admin"]["form"]["fields"]
>;

const LATER_FIELDS: LaterFieldKey[] = [
  "hosts",
  "publicUrl",
  "databaseUrl",
  "mailTenant",
  "resendFromEmail",
  "resendApiKey",
  "googleMapsApiKey",
  "googleMapsMapId",
  "vapidPublicKey",
  "vapidPrivateKey",
  "vapidContactEmail",
  "whatsappAccessToken",
  "whatsappPhoneNumberId",
  "whatsappClassReminderTemplateName",
];

export interface PulsarAdminTenantLaterFieldsProps {
  dict: Dictionary;
  values: PulsarTenantFormValues;
  open: boolean;
  onChange: <K extends keyof PulsarTenantFormValues>(
    key: K,
    value: PulsarTenantFormValues[K],
  ) => void;
}

export function PulsarAdminTenantLaterFields({
  dict,
  values,
  open,
  onChange,
}: PulsarAdminTenantLaterFieldsProps) {
  const formCopy = dict.pulsar.admin.form;
  const labels = formCopy.fields;

  return (
    <details
      open={open}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
    >
      <summary className="cursor-pointer text-base font-bold text-[var(--color-foreground)]">
        {formCopy.laterTitle}
      </summary>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{formCopy.laterLead}</p>
      <div className="mt-4 grid gap-4">
        {LATER_FIELDS.map((fieldKey) => (
          <div key={fieldKey}>
            <label htmlFor={`field-${fieldKey}`} className="block text-xs font-semibold">
              {labels[fieldKey]}
            </label>
            <input
              id={`field-${fieldKey}`}
              type="text"
              value={String(values[fieldKey] ?? "")}
              onChange={(e) =>
                onChange(fieldKey, e.target.value as PulsarTenantFormValues[typeof fieldKey])
              }
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs"
            />
          </div>
        ))}
      </div>
    </details>
  );
}
