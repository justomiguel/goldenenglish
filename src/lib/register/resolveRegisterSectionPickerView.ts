import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import {
  comboOptionsForRegisterPicker,
  normalizeRegisterPickerOptions,
  type RegistrationSectionPickerOption,
} from "@/lib/register/registrationSectionPicker";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";

export function resolveRegisterChoosableIds(
  options: Array<{ id: string; label: string } & Partial<RegistrationSectionPickerOption>>,
  intent: RegisterIntent,
): string[] {
  return comboOptionsForRegisterPicker(normalizeRegisterPickerOptions(options), intent).map(
    (option) => option.id,
  );
}

export function resolveRegisterSectionPickerView(input: {
  choosableIds: string[];
  showAllSections: boolean;
}): {
  showPicker: boolean;
  hiddenPreferredSectionId: string;
} {
  const hiddenPreferredSectionId = input.choosableIds[0] ?? REGISTRATION_UNDECIDED_FORM_VALUE;
  return {
    showPicker: input.showAllSections && input.choosableIds.length > 1,
    hiddenPreferredSectionId,
  };
}

export function initialRegisterSelectedSectionIds(input: {
  choosableIds: string[];
  showAllSections: boolean;
  hasEnrollmentLink?: boolean;
}): string[] {
  if (input.hasEnrollmentLink) return [];
  const view = resolveRegisterSectionPickerView(input);
  if (view.showPicker) return [];
  return [view.hiddenPreferredSectionId];
}

export function resolveRegisterAssignedSectionLabel(input: {
  sectionOptions: Array<{ id: string; label: string }>;
  hiddenPreferredSectionId: string;
  showPicker: boolean;
  hasEnrollmentLink: boolean;
}): string | null {
  if (input.showPicker || input.hasEnrollmentLink) return null;
  if (input.hiddenPreferredSectionId === REGISTRATION_UNDECIDED_FORM_VALUE) return null;
  const match = input.sectionOptions.find((option) => option.id === input.hiddenPreferredSectionId);
  return match?.label ?? null;
}
