"use client";

import { useMemo, useState } from "react";
import { RegisterSectionMultiSelect } from "@/components/register/RegisterSectionMultiSelect";
import { RegisterSectionWeekCalendar } from "@/components/register/RegisterSectionWeekCalendar";
import {
  comboOptionsForRegisterPicker,
  flattenRegisterPickerCells,
  normalizeRegisterPickerOptions,
  type RegistrationSectionPickerOption,
} from "@/lib/register/registrationSectionPicker";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import type { Dictionary } from "@/types/i18n";

export type RegisterPickerView = "calendar" | "combo";

function defaultPickerView(): RegisterPickerView {
  if (typeof window === "undefined") return "combo";
  return window.matchMedia("(min-width: 768px)").matches ? "calendar" : "combo";
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

  function toggleSection(sectionId: string) {
    const withoutUndecided = selectedIds.filter((id) => id !== REGISTRATION_UNDECIDED_FORM_VALUE);
    if (withoutUndecided.includes(sectionId)) {
      onChange(withoutUndecided.filter((id) => id !== sectionId));
      return;
    }
    onChange([...withoutUndecided, sectionId]);
  }

  return (
    <fieldset className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4">
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
            view === "calendar"
              ? "bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]"
              : "text-[var(--color-muted-foreground)]"
          }`}
          aria-pressed={view === "calendar"}
          onClick={() => setView("calendar")}
        >
          {dict.picker.viewCalendar}
        </button>
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
      </div>
      {view === "calendar" ? (
        cells.length === 0 && intent === "trial" ? (
          <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
            {dict.picker.noTrialSections}
          </p>
        ) : (
          <RegisterSectionWeekCalendar
            dict={dict}
            cells={cells}
            selectedIds={selectedIds}
            onToggleSection={toggleSection}
          />
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
