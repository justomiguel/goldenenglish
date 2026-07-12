import { z } from "zod";

const roleZ = z.enum(["admin", "teacher", "student", "parent", "assistant"]);

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

export const usersSpreadsheetRowSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((s) => s.toLowerCase()),
  role: roleZ,
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  dni_or_passport: z
    .string()
    .max(32)
    .optional()
    .transform((s) => emptyToNull(s ?? "")),
  phone: z
    .string()
    .max(40)
    .optional()
    .transform((s) => emptyToNull(s ?? "")),
  birth_date: z
    .string()
    .optional()
    .transform((s) => emptyToNull(s ?? ""))
    .pipe(z.union([z.null(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])),
});

export type UsersSpreadsheetRow = z.infer<typeof usersSpreadsheetRowSchema>;

export type UsersSpreadsheetInvalidRow = {
  rowIndex: number;
  issues: string[];
};

function cell(raw: Record<string, unknown>, key: string): string {
  const v = raw[key] ?? raw[key.toUpperCase()] ?? "";
  if (v == null) return "";
  return String(v);
}

export function parseUsersSpreadsheetRawRows(rawRows: Record<string, unknown>[]): {
  valid: UsersSpreadsheetRow[];
  invalid: UsersSpreadsheetInvalidRow[];
} {
  const valid: UsersSpreadsheetRow[] = [];
  const invalid: UsersSpreadsheetInvalidRow[] = [];

  rawRows.forEach((raw, rowIndex) => {
    const candidate = {
      email: cell(raw, "email"),
      role: cell(raw, "role").trim().toLowerCase(),
      first_name: cell(raw, "first_name"),
      last_name: cell(raw, "last_name"),
      dni_or_passport: cell(raw, "dni_or_passport"),
      phone: cell(raw, "phone"),
      birth_date: cell(raw, "birth_date"),
    };
    const parsed = usersSpreadsheetRowSchema.safeParse(candidate);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      invalid.push({
        rowIndex,
        issues: parsed.error.issues.map((i) => i.path.join(".") || i.code),
      });
    }
  });

  return { valid, invalid };
}
