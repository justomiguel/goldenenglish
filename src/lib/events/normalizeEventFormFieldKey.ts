const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]{1,62}$/;

const RESERVED_FIELD_KEYS = new Set([
  "first_name",
  "last_name",
  "first_name_last_name",
  "dni",
  "dni_or_passport",
  "email",
  "phone",
  "birth_date",
  "consent",
  "tutor",
  "payment",
  "residency",
  "is_local_resident",
]);

export type NormalizeEventFormFieldKeyResult =
  | { ok: true; value: string }
  | { ok: false; code: "empty" | "invalid" | "reserved" };

export function normalizeEventFormFieldKey(raw: string): NormalizeEventFormFieldKeyResult {
  const value = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (!value) return { ok: false, code: "empty" };
  if (!FIELD_KEY_PATTERN.test(value)) return { ok: false, code: "invalid" };
  if (RESERVED_FIELD_KEYS.has(value)) return { ok: false, code: "reserved" };
  return { ok: true, value };
}
