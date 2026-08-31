"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { RegisterSectionMultiSelect } from "@/components/register/RegisterSectionMultiSelect";
import { RegisterSectionWeekCalendar } from "@/components/register/RegisterSectionWeekCalendar";
import {
  comboOptionsForRegisterPicker,
  flattenRegisterPickerCells,
  formatRegisterPickerSelectionChip,
  normalizeRegisterPickerOptions,
  type RegistrationSectionPickerOption,
} from "@/lib/register/registrationSectionPicker";
import {
  registerPickerSectionToneIndex,
  registerPickerSectionToneStyle,
} from "@/lib/register/registerPickerSectionTone";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import type { Dictionary } from "@/types/i18n";

export type RegisterPickerView = "calendar" | "combo";

function defaultPickerView(): RegisterPickerView {
  return "combo";
}

export function RegisterSectionPicker({
  dict,
  options,
  intent,
  selectedIds,
  onChange,
  initialView,
}: {
  dict: Dictionary["register"];
  options: Array<{ id: string; label: string } & Partial<RegistrationSectionPickerOption>>;
  intent: RegisterIntent;
  selectedIds: string[];
  onChange: (next: string[]) => void;
  initialView?: RegisterPickerView;
}) {
  const [view, setView] = useState<RegisterPickerView>(initialView ?? defaultPickerView);
  const normalized = useMemo(() => normalizeRegisterPickerOptions(options), [options]);
  const cells = useMemo(
    () => flattenRegisterPickerCells(normalized, intent),
    [normalized, intent],
  );
  const comboOptions = useMemo(
    () => comboOptionsForRegisterPicker(normalized, intent),
    [normalized, intent],
  );
  const sectionIds = useMemo(() => cells.map((cell) => cell.sectionId), [cells]);
  const selectedChips = useMemo(() => {
    const weekdays = dict.sectionLink.weekdays;
    return selectedIds
      .filter((id) => id !== REGISTRATION_UNDECIDED_FORM_VALUE)
      .flatMap((id) => {
        const sectionCells = cells.filter((cell) => cell.sectionId === id);
        if (sectionCells.length === 0) return [];
        return [{ id, text: formatRegisterPickerSelectionChip(sectionCells, weekdays) }];
      });
  }, [cells, dict.sectionLink.weekdays, selectedIds]);

  function toggleSection(sectionId: string) {
    const withoutUndecided = selectedIds.filter((id) => id !== REGISTRATION_UNDECIDED_FORM_VALUE);
    if (withoutUndecided.includes(sectionId)) {
      onChange(withoutUndecided.filter((id) => id !== sectionId));
      return;
    }
    onChange([...withoutUndecided, sectionId]);
  }

  return (
    <fieldset className="min-w-0 space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4">
      <legend className="px-1 text-sm font-semibold text-[var(--color-foreground)]">
        {dict.sectionsTitle}
      </legend>
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.sectionsHint}</p>
      <div
        className="inline-flex rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
        role="group"
        aria-label={dict.sectionsTitle}
      >
        <button
          type="button"
          className={`min-h-11 rounded-[calc(var(--layout-border-radius)-2px)] px-3 text-sm ${
            view === "combo"
              ? "bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]"
              : "text-[var(--color-muted-foreground)]"
          }`}
          aria-pressed={view === "combo"}
          onClick={() => setView("combo")}
        >
          {dict.picker.viewCombo}
        </button>
        <button
          type="button"
          className={`min-h-11 rounded-[calc(var(--layout-border-radius)-2px)] px-3 text-sm ${
            view === "calendar"
              ? "bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]"
              : "text-[var(--color-muted-foreground)]"
          }`}
          aria-pressed={view === "calendar"}
          onClick={() => setView("calendar")}
        >
          {dict.picker.viewCalendar}
        </button>
      </div>
      {view === "calendar" ? (
        cells.length === 0 && intent === "trial" ? (
          <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
            {dict.picker.noTrialSections}
          </p>
        ) : (
          <>
            {selectedChips.length > 0 ? (
              <ul
                data-testid="register-week-selected"
                className="flex flex-wrap gap-2"
                aria-label={dict.picker.selectedAria}
              >
                {selectedChips.map((chip) => {
                  const tone = registerPickerSectionToneStyle(chip.id, "strong", sectionIds);
                  return (
                  <li
                    key={chip.id}
                    data-section-tone={String(registerPickerSectionToneIndex(chip.id, sectionIds))}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-sm"
                    style={tone}
                  >
                    <span className="truncate">{chip.text}</span>
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-black/10"
                      style={{ color: tone.color }}
                      aria-label={dict.sectionsRemove.replace("{label}", chip.text)}
                      onClick={() => toggleSection(chip.id)}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                  );
                })}
              </ul>
            ) : null}
            <RegisterSectionWeekCalendar
              dict={dict}
              cells={cells}
              selectedIds={selectedIds}
              onToggleSection={toggleSection}
            />
          </>
        )
      ) : null}
      <div className={view === "combo" ? undefined : "hidden"}>
        <RegisterSectionMultiSelect
          dict={dict}
          sectionOptions={comboOptions}
          selectedIds={selectedIds}
          onChange={onChange}
          embedded
        />
      </div>
    </fieldset>
  );
}
