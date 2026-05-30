export const EVENT_FORM_FIELD_SELECT_MIN_OPTIONS = 2;

export function createDefaultSelectOptionRows(): string[] {
  return Array.from({ length: EVENT_FORM_FIELD_SELECT_MIN_OPTIONS }, () => "");
}

export function sanitizeEventFormFieldSelectOptions(
  options: string[],
):
  | { ok: true; values: string[] }
  | { ok: false; reason: "too_few_options" | "empty_option" } {
  const trimmed = options.map((option) => option.trim());
  const values = trimmed.filter((option) => option.length > 0);

  if (values.length < EVENT_FORM_FIELD_SELECT_MIN_OPTIONS) {
    return { ok: false, reason: "too_few_options" };
  }

  if (trimmed.some((option, index) => option.length === 0 && index < options.length)) {
    const hasGapBeforeFilled = trimmed.some(
      (option, index) => option.length === 0 && trimmed.slice(index + 1).some((next) => next.length > 0),
    );
    if (hasGapBeforeFilled) {
      return { ok: false, reason: "empty_option" };
    }
  }

  return { ok: true, values };
}
