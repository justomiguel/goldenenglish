import type { Dictionary } from "@/types/i18n";

export interface PulsarTenantFormValues {
  slug: string;
  displayName: string;
  isEnabled: boolean;
  hosts: string;
  publicUrl: string;
  brandThemeSlug: string;
  skipInitialSiteSetup: boolean;
  debugLogin: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  databaseUrl: string;
  mailTenant: string;
  resendFromEmail: string;
  resendApiKey: string;
  paymentGatewaySecretEncryptionKey: string;
  kvRestApiUrl: string;
  kvRestApiToken: string;
  googleMapsApiKey: string;
  googleMapsMapId: string;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidContactEmail: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappClassReminderTemplateName: string;
}

export interface PulsarAdminTenantFieldGroupsProps {
  dict: Dictionary;
  values: PulsarTenantFormValues;
  isEditing: boolean;
  onChange: <K extends keyof PulsarTenantFormValues>(
    key: K,
    value: PulsarTenantFormValues[K],
  ) => void;
}

const TEXT_SECTIONS: Array<{
  sectionKey:
    | "sectionSupabase"
    | "sectionEmail"
    | "sectionPaymentsKv"
    | "sectionIntegrations";
  fields: Array<keyof PulsarTenantFormValues>;
}> = [
  {
    sectionKey: "sectionSupabase",
    fields: ["supabaseUrl", "supabaseAnonKey", "supabaseServiceRoleKey", "databaseUrl"],
  },
  {
    sectionKey: "sectionEmail",
    fields: ["mailTenant", "resendFromEmail", "resendApiKey"],
  },
  {
    sectionKey: "sectionPaymentsKv",
    fields: ["paymentGatewaySecretEncryptionKey", "kvRestApiUrl", "kvRestApiToken"],
  },
  {
    sectionKey: "sectionIntegrations",
    fields: [
      "googleMapsApiKey",
      "googleMapsMapId",
      "vapidPublicKey",
      "vapidPrivateKey",
      "vapidContactEmail",
      "whatsappAccessToken",
      "whatsappPhoneNumberId",
      "whatsappClassReminderTemplateName",
    ],
  },
];

export function PulsarAdminTenantFieldGroups({
  dict,
  values,
  isEditing,
  onChange,
}: PulsarAdminTenantFieldGroupsProps) {
  const formCopy = dict.pulsar.admin.form;
  const labels = formCopy.fields;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-base font-bold text-[var(--color-foreground)]">
          {formCopy.sectionIdentity}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="field-slug" className="block text-xs font-semibold">
              {labels.slug}
            </label>
            <input
              id="field-slug"
              type="text"
              required
              disabled={isEditing}
              value={values.slug}
              onChange={(e) => onChange("slug", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="field-displayName" className="block text-xs font-semibold">
              {labels.displayName}
            </label>
            <input
              id="field-displayName"
              type="text"
              required
              value={values.displayName}
              onChange={(e) => onChange("displayName", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="field-hosts" className="block text-xs font-semibold">
              {labels.hosts}
            </label>
            <input
              id="field-hosts"
              type="text"
              required
              value={values.hosts}
              onChange={(e) => onChange("hosts", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label htmlFor="field-publicUrl" className="block text-xs font-semibold">
              {labels.publicUrl}
            </label>
            <input
              id="field-publicUrl"
              type="text"
              value={values.publicUrl}
              onChange={(e) => onChange("publicUrl", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label htmlFor="field-brandThemeSlug" className="block text-xs font-semibold">
              {labels.brandThemeSlug}
            </label>
            <input
              id="field-brandThemeSlug"
              type="text"
              value={values.brandThemeSlug}
              onChange={(e) => onChange("brandThemeSlug", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={values.isEnabled}
              onChange={(e) => onChange("isEnabled", e.target.checked)}
            />
            <span>{labels.isEnabled}</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={values.skipInitialSiteSetup}
              onChange={(e) => onChange("skipInitialSiteSetup", e.target.checked)}
            />
            <span>{labels.skipInitialSiteSetup}</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={values.debugLogin}
              onChange={(e) => onChange("debugLogin", e.target.checked)}
            />
            <span>{labels.debugLogin}</span>
          </label>
        </div>
      </section>

      {TEXT_SECTIONS.map(({ sectionKey, fields }) => (
        <section
          key={sectionKey}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <h2 className="text-base font-bold text-[var(--color-foreground)]">
            {formCopy[sectionKey]}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fields.map((fieldKey) => (
              <div key={fieldKey} className="sm:col-span-2">
                <label
                  htmlFor={`field-${fieldKey}`}
                  className="block text-xs font-semibold"
                >
                  {labels[fieldKey as keyof typeof labels]}
                </label>
                <input
                  id={`field-${fieldKey}`}
                  type="text"
                  value={String(values[fieldKey] ?? "")}
                  onChange={(e) =>
                    onChange(
                      fieldKey,
                      e.target.value as PulsarTenantFormValues[typeof fieldKey],
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs"
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
