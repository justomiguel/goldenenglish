export type CourseFieldKind = "text" | "dropdown" | "checkbox" | "date";

export type CourseFieldDefinitionRule = {
  id: string;
  kind: CourseFieldKind;
  required: boolean;
  optionIds: string[];
};

export type CourseFieldSubmission = {
  fieldId: string;
  text?: string;
  optionId?: string;
  checked?: boolean;
  date?: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseFieldOptionLabels(raw: string): string[] {
  const labels: string[] = [];
  for (const part of raw.split(/[\n;]+/)) {
    const label = part.trim();
    if (!label || label.length > 80 || labels.includes(label)) continue;
    labels.push(label);
    if (labels.length === 30) break;
  }
  return labels;
}

function valueMatches(def: CourseFieldDefinitionRule, value: CourseFieldSubmission | undefined): boolean {
  if (!value) return !def.required;
  if (def.kind === "text") {
    const text = value.text?.trim() ?? "";
    return def.required ? text.length > 0 && text.length <= 500 : text.length <= 500;
  }
  if (def.kind === "dropdown") {
    if (!value.optionId) return !def.required;
    return def.optionIds.includes(value.optionId);
  }
  if (def.kind === "checkbox") {
    return def.required ? value.checked === true : value.checked === true || value.checked === false || value.checked === undefined;
  }
  if (!value.date) return !def.required;
  return DATE_PATTERN.test(value.date);
}

export function courseFieldSubmissionIsValid(
  definitions: CourseFieldDefinitionRule[],
  values: CourseFieldSubmission[],
): boolean {
  const known = new Set(definitions.map((def) => def.id));
  if (values.some((value) => !known.has(value.fieldId))) return false;
  const byId = new Map(values.map((value) => [value.fieldId, value]));
  return definitions.every((def) => valueMatches(def, byId.get(def.id)));
}
