import { X } from "lucide-react";
import { Label } from "@/components/atoms/Label";
import { REGISTER_NATIVE_SELECT_CN } from "@/components/register/registerFormNativeSelectCn";
import { parseRequestedSectionIds } from "@/lib/register/parseRequestedSectionIds";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import type { Dictionary } from "@/types/i18n";

interface RegisterSectionMultiSelectProps {
  dict: Dictionary["register"];
  sectionOptions: { id: string; label: string }[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  lockedPreferredId?: string | null;
  embedded?: boolean;
}

export function RegisterSectionMultiSelect({
  dict,
  sectionOptions,
  selectedIds,
  onChange,
  lockedPreferredId = null,
  embedded = false,
}: RegisterSectionMultiSelectProps) {
  const order = sectionOptions.map((o) => o.id);
  const extras = lockedPreferredId
    ? sectionOptions.filter((o) => o.id !== lockedPreferredId)
    : sectionOptions;
  const labelById = new Map(sectionOptions.map((o) => [o.id, o.label]));

  const parsed = parseRequestedSectionIds({
    selectedIds,
    sectionOptionsOrder: order,
    lockedPreferredId,
    allowUndecided: !lockedPreferredId,
  });
  const preferred = parsed.ok ? parsed.preferredSectionId : lockedPreferredId;
  const additional = parsed.ok ? parsed.additionalSectionIds : [];
  const undecided = parsed.ok && parsed.undecided;
  const remaining = extras.filter((o) => !selectedIds.includes(o.id) && o.id !== preferred);
  const showAddAnother =
    remaining.length > 0 && Boolean(lockedPreferredId || (preferred && !undecided));
  const primaryValue = undecided
    ? REGISTRATION_UNDECIDED_FORM_VALUE
    : (preferred ?? "");

  function setPrimary(value: string) {
    if (!value) {
      onChange([]);
      return;
    }
    if (value === REGISTRATION_UNDECIDED_FORM_VALUE) {
      onChange([REGISTRATION_UNDECIDED_FORM_VALUE]);
      return;
    }
    onChange([value, ...additional.filter((id) => id !== value)]);
  }

  function addExtra(value: string) {
    if (!value) return;
    const withoutUndecided = selectedIds.filter((s) => s !== REGISTRATION_UNDECIDED_FORM_VALUE);
    if (withoutUndecided.includes(value)) return;
    onChange([...withoutUndecided, value]);
  }

  function removeExtra(id: string) {
    onChange(selectedIds.filter((s) => s !== id));
  }

  return (
    <fieldset className="space-y-2">
      {embedded ? null : (
        <>
          <legend className="text-sm font-semibold text-[var(--color-foreground)]">
            {dict.sectionsTitle}
          </legend>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {lockedPreferredId ? dict.sectionsAlsoJoin : dict.sectionsHint}
          </p>
        </>
      )}
      <input
        type="hidden"
        name="preferred_section_id"
        value={preferred ?? REGISTRATION_UNDECIDED_FORM_VALUE}
        readOnly
      />
      {additional.map((id) => (
        <input key={id} type="hidden" name="additional_section_ids" value={id} readOnly />
      ))}
      {!lockedPreferredId ? (
        <div>
          <Label htmlFor="rg-section" className="sr-only">
            {dict.level}
          </Label>
          <select
            id="rg-section"
            className={`${REGISTER_NATIVE_SELECT_CN} min-h-11`}
            value={primaryValue}
            onChange={(e) => setPrimary(e.target.value)}
          >
            <option value="">{dict.sectionPlaceholder}</option>
            <option value={REGISTRATION_UNDECIDED_FORM_VALUE}>
              {dict.sectionUndecidedOption}
            </option>
            {extras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {additional.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {additional.map((id) => {
            const label = labelById.get(id) ?? id;
            return (
              <li
                key={id}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-2.5 py-1 text-sm text-[var(--color-foreground)]"
              >
                <span className="truncate">{label}</span>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  aria-label={dict.sectionsRemove.replace("{label}", label)}
                  onClick={() => removeExtra(id)}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {showAddAnother ? (
        <div>
          <Label htmlFor="rg-section-extra" className="sr-only">
            {dict.sectionsAlsoJoin}
          </Label>
          <select
            id="rg-section-extra"
            className={`${REGISTER_NATIVE_SELECT_CN} min-h-11`}
            value=""
            onChange={(e) => addExtra(e.target.value)}
          >
            <option value="">{dict.sectionsAlsoJoin}</option>
            {remaining.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {!lockedPreferredId && extras.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
          {dict.noSectionsAvailable}
        </p>
      ) : null}
    </fieldset>
  );
}
