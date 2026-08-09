import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";

interface ParentWardCareNotesFieldsProps {
  labels: Dictionary["dashboard"]["parent"];
  careHealth: string;
  careDiet: string;
  careSupport: string;
  onCareHealthChange: (value: string) => void;
  onCareDietChange: (value: string) => void;
  onCareSupportChange: (value: string) => void;
}

export function ParentWardCareNotesFields({
  labels,
  careHealth,
  careDiet,
  careSupport,
  onCareHealthChange,
  onCareDietChange,
  onCareSupportChange,
}: ParentWardCareNotesFieldsProps) {
  return (
    <fieldset className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-4">
      <legend className="px-1 text-sm font-semibold text-[var(--color-secondary)]">
        {labels.wardCareTitle}
      </legend>
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.wardCareLead}</p>
      <div>
        <Label htmlFor="ward-care-health">{labels.wardCareHealth}</Label>
        <textarea
          id="ward-care-health"
          rows={3}
          maxLength={2000}
          value={careHealth}
          onChange={(e) => onCareHealthChange(e.target.value)}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="ward-care-diet">{labels.wardCareDiet}</Label>
        <textarea
          id="ward-care-diet"
          rows={3}
          maxLength={2000}
          value={careDiet}
          onChange={(e) => onCareDietChange(e.target.value)}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="ward-care-support">{labels.wardCareSupport}</Label>
        <textarea
          id="ward-care-support"
          rows={3}
          maxLength={2000}
          value={careSupport}
          onChange={(e) => onCareSupportChange(e.target.value)}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </div>
    </fieldset>
  );
}
