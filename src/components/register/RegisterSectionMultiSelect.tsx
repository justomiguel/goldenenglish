import { Label } from "@/components/atoms/Label";
import { parseRequestedSectionIds } from "@/lib/register/parseRequestedSectionIds";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import type { Dictionary } from "@/types/i18n";

interface RegisterSectionMultiSelectProps {
  dict: Dictionary["register"];
  sectionOptions: { id: string; label: string }[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  lockedPreferredId?: string | null;
}

export function RegisterSectionMultiSelect({
  dict,
  sectionOptions,
  selectedIds,
  onChange,
  lockedPreferredId = null,
}: RegisterSectionMultiSelectProps) {
  const order = sectionOptions.map((o) => o.id);
  const extras = lockedPreferredId
    ? sectionOptions.filter((o) => o.id !== lockedPreferredId)
    : sectionOptions;

  function toggle(id: string, checked: boolean) {
    if (id === REGISTRATION_UNDECIDED_FORM_VALUE) {
      onChange(checked ? [REGISTRATION_UNDECIDED_FORM_VALUE] : []);
      return;
    }
    const withoutUndecided = selectedIds.filter((s) => s !== REGISTRATION_UNDECIDED_FORM_VALUE);
    if (checked) {
      onChange(withoutUndecided.includes(id) ? withoutUndecided : [...withoutUndecided, id]);
      return;
    }
    onChange(withoutUndecided.filter((s) => s !== id));
  }

  const parsed = parseRequestedSectionIds({
    selectedIds,
    sectionOptionsOrder: order,
    lockedPreferredId,
    allowUndecided: !lockedPreferredId,
  });
  const preferred = parsed.ok ? parsed.preferredSectionId : lockedPreferredId;
  const additional = parsed.ok ? parsed.additionalSectionIds : [];

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-[var(--color-foreground)]">
        {dict.sectionsTitle}
      </legend>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {lockedPreferredId ? dict.sectionsAlsoJoin : dict.sectionsHint}
      </p>
      <input type="hidden" name="preferred_section_id" value={preferred ?? REGISTRATION_UNDECIDED_FORM_VALUE} readOnly />
      {additional.map((id) => (
        <input key={id} type="hidden" name="additional_section_ids" value={id} readOnly />
      ))}
      {!lockedPreferredId ? (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={selectedIds.includes(REGISTRATION_UNDECIDED_FORM_VALUE)}
            onChange={(e) => toggle(REGISTRATION_UNDECIDED_FORM_VALUE, e.target.checked)}
          />
          {dict.sectionUndecidedOption}
        </label>
      ) : null}
      {extras.map((o) => (
        <label key={o.id} className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={selectedIds.includes(o.id)}
            onChange={(e) => toggle(o.id, e.target.checked)}
          />
          {o.label}
        </label>
      ))}
      {!lockedPreferredId && extras.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
          {dict.noSectionsAvailable}
        </p>
      ) : null}
      <Label className="sr-only">{dict.level}</Label>
    </fieldset>
  );
}
