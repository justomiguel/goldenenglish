export const ACADEMIC_PROFILE_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "email",
  "phone",
  "select",
  "file",
  "image",
] as const;

export type AcademicProfileFieldType = (typeof ACADEMIC_PROFILE_FIELD_TYPES)[number];

export type AcademicProfileFieldDraft = {
  label: string;
  fieldType: string;
  selectOptions: string[];
  required: boolean;
  showInDirectory: boolean;
};

export type NormalizedAcademicProfileField = {
  label: string;
  fieldType: AcademicProfileFieldType;
  selectOptions: string[];
  required: boolean;
  showInDirectory: boolean;
};

export function academicProfileValueSlot(
  fieldType: AcademicProfileFieldType,
): "text" | "number" | "date" | "file" {
  if (fieldType === "number") return "number";
  if (fieldType === "date") return "date";
  if (fieldType === "file" || fieldType === "image") return "file";
  return "text";
}

export function isActiveAcademicProfileField(field: { archivedAt: string | null }): boolean {
  return field.archivedAt == null;
}

function isFieldType(value: string): value is AcademicProfileFieldType {
  return (ACADEMIC_PROFILE_FIELD_TYPES as readonly string[]).includes(value);
}

export function normalizeAcademicProfileFieldDraft(
  draft: AcademicProfileFieldDraft,
): { ok: true; field: NormalizedAcademicProfileField } | { ok: false; error: "label" | "type" | "options" } {
  const label = draft.label.trim();
  if (label.length < 1 || label.length > 80) return { ok: false, error: "label" };
  if (!isFieldType(draft.fieldType)) return { ok: false, error: "type" };
  const selectOptions = draft.selectOptions.map((option) => option.trim()).filter((option) => option.length > 0);
  if (draft.fieldType === "select" && selectOptions.length === 0) return { ok: false, error: "options" };
  const fileLike = draft.fieldType === "file" || draft.fieldType === "image";
  return {
    ok: true,
    field: {
      label,
      fieldType: draft.fieldType,
      selectOptions: draft.fieldType === "select" ? selectOptions : [],
      required: draft.required,
      showInDirectory: fileLike ? false : draft.showInDirectory,
    },
  };
}
