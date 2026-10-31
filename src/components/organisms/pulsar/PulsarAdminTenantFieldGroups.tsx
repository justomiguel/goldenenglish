import type { Dictionary } from "@/types/i18n";
import { previewHostsForTenantSlug } from "@/lib/tenant/pulsarSubdomain";
import { PulsarAdminTemplateSelect } from "@/components/organisms/pulsar/PulsarAdminTemplateSelect";
import { PulsarAdminTenantFieldLabel } from "@/components/organisms/pulsar/PulsarAdminTenantFieldLabel";
import { PulsarAdminTenantLaterFields } from "@/components/organisms/pulsar/PulsarAdminTenantLaterFields";

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
  pulsarMailQuota: string;
  dataMode: "project" | "shared_schema";
}

export interface PulsarAdminTenantFieldGroupsProps {
  dict: Dictionary;
  values: PulsarTenantFormValues;
  isEditing: boolean;
  mailSent: number | null;
  pulsarHosts: readonly string[];
  onChange: <K extends keyof PulsarTenantFormValues>(
    key: K,
    value: PulsarTenantFormValues[K],
  ) => void;
}

const PROJECT_SUPABASE_FIELDS = [
  "supabaseUrl",
  "supabaseAnonKey",
  "supabaseServiceRoleKey",
] as const;

export function PulsarAdminTenantFieldGroups({
  dict,
  values,
  isEditing,
  mailSent,
  pulsarHosts,
  onChange,
}: PulsarAdminTenantFieldGroupsProps) {
  const formCopy = dict.pulsar.admin.form;
  const labels = formCopy.fields;
  const previewHosts = previewHostsForTenantSlug(values.slug, pulsarHosts);
  const sentLine =
    mailSent === null
      ? null
      : formCopy.pulsarMailSent
          .replace("{sent}", String(mailSent))
          .replace("{quota}", values.pulsarMailQuota || "0");

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-base font-bold text-[var(--color-foreground)]">
          {formCopy.sectionIdentity}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <PulsarAdminTenantFieldLabel
              htmlFor="field-slug"
              text={labels.slug}
              mark={formCopy.requiredMark}
            />
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
            <PulsarAdminTenantFieldLabel
              htmlFor="field-displayName"
              text={labels.displayName}
              mark={formCopy.requiredMark}
            />
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
            <p className="text-xs font-semibold">{formCopy.previewHostLabel}</p>
            {previewHosts.length > 0 ? (
              <p className="mt-1 font-mono text-sm text-[var(--color-foreground)]">
                {previewHosts.join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {formCopy.previewHostEmpty}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="field-pulsarMailQuota" className="block text-xs font-semibold">
              {labels.pulsarMailQuota}
            </label>
            <input
              id="field-pulsarMailQuota"
              type="number"
              min={0}
              max={100000}
              required
              value={values.pulsarMailQuota}
              onChange={(e) => onChange("pulsarMailQuota", e.target.value)}
              className="mt-1 w-full max-w-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {formCopy.pulsarMailQuotaLead}
            </p>
            {sentLine ? (
              <p className="mt-1 text-xs font-semibold text-[var(--color-foreground)]">{sentLine}</p>
            ) : null}
          </div>
          <PulsarAdminTemplateSelect
            label={labels.brandThemeSlug}
            lead={formCopy.templateLead}
            unsetLabel={formCopy.templateUnset}
            value={values.brandThemeSlug}
            names={dict.landing.genericLandings}
            onChange={(slug) => onChange("brandThemeSlug", slug)}
          />
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

      {values.dataMode === "project" ? (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-base font-bold text-[var(--color-foreground)]">
            {formCopy.sectionSupabase}
          </h2>
          <div className="mt-4 grid gap-4">
            {PROJECT_SUPABASE_FIELDS.map((fieldKey) => (
              <div key={fieldKey}>
                <PulsarAdminTenantFieldLabel
                  htmlFor={`field-${fieldKey}`}
                  text={labels[fieldKey]}
                  mark={formCopy.requiredMark}
                />
                <input
                  id={`field-${fieldKey}`}
                  type="text"
                  required
                  value={values[fieldKey]}
                  onChange={(e) => onChange(fieldKey, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <PulsarAdminTenantLaterFields
        dict={dict}
        values={values}
        open={isEditing}
        onChange={onChange}
      />
    </div>
  );
}
