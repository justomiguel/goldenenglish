import type { Dictionary } from "@/types/i18n";
import {
  genericKindFromThemeSlug,
  staffTemplateSelectOptions,
} from "@/lib/theme/genericInstituteTemplates";

export interface PulsarAdminTemplateSelectProps {
  label: string;
  lead: string;
  unsetLabel: string;
  value: string;
  /** Tenant slug from the form. An exclusive template appears only for its owner. */
  tenantSlug: string;
  /** Readable name per exclusive kind, keyed by the kind. */
  exclusiveNames?: Record<string, string>;
  names: Dictionary["landing"]["genericLandings"];
  onChange: (slug: string) => void;
}

export function PulsarAdminTemplateSelect({
  label,
  lead,
  unsetLabel,
  value,
  tenantSlug,
  exclusiveNames,
  names,
  onChange,
}: PulsarAdminTemplateSelectProps) {
  const options = staffTemplateSelectOptions(value, tenantSlug);

  return (
    <div className="sm:col-span-2">
      <label htmlFor="field-brandThemeSlug" className="block text-xs font-semibold">
        {label}
      </label>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{lead}</p>
      <select
        id="field-brandThemeSlug"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
      >
        {value === "" ? <option value="">{unsetLabel}</option> : null}
        {options.map((slug) => {
          const kind = genericKindFromThemeSlug(slug);
          const text = kind ? names[kind]?.name ?? slug : exclusiveNames?.[slug] ?? slug;
          return (
            <option key={slug} value={slug}>
              {text}
            </option>
          );
        })}
      </select>
    </div>
  );
}
