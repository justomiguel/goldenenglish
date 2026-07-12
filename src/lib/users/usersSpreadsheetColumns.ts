export const USERS_SPREADSHEET_COLUMNS = [
  "email",
  "role",
  "first_name",
  "last_name",
  "dni_or_passport",
  "phone",
  "birth_date",
] as const;

export type UsersSpreadsheetColumn = (typeof USERS_SPREADSHEET_COLUMNS)[number];

export const USERS_SPREADSHEET_REQUIRED_COLUMNS = [
  "email",
  "role",
  "first_name",
  "last_name",
] as const satisfies readonly UsersSpreadsheetColumn[];

export type AssertUsersSpreadsheetHeadersResult =
  | { ok: true }
  | { ok: false; code: "missing_headers"; missing: string[] };

/** Normalize header cells for comparison (trim + lowercase). */
export function normalizeUsersSpreadsheetHeader(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertUsersSpreadsheetHeaders(
  headers: string[],
): AssertUsersSpreadsheetHeadersResult {
  const present = new Set(headers.map(normalizeUsersSpreadsheetHeader));
  const missing = USERS_SPREADSHEET_REQUIRED_COLUMNS.filter((c) => !present.has(c));
  if (missing.length > 0) {
    return { ok: false, code: "missing_headers", missing: [...missing] };
  }
  return { ok: true };
}
