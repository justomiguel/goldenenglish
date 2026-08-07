import type { UsersSpreadsheetRow } from "@/lib/users/usersSpreadsheetRowSchema";

export type ExistingProfileForUsersSpreadsheet = {
  id: string;
  email: string | null;
  dni_or_passport: string | null;
};

export type ClassifiedUsersSpreadsheetDuplicate = {
  row: UsersSpreadsheetRow;
  existingId: string;
  match: "email" | "dni";
};

export type ClassifyUsersSpreadsheetResult = {
  newRows: UsersSpreadsheetRow[];
  duplicateRows: ClassifiedUsersSpreadsheetDuplicate[];
};

function normEmail(email: string | null | undefined): string | null {
  const t = (email ?? "").trim().toLowerCase();
  return t === "" ? null : t;
}

function normDni(dni: string | null | undefined): string | null {
  const t = (dni ?? "").trim().toLowerCase();
  return t === "" ? null : t;
}

export function classifyUsersSpreadsheetRows(
  rows: UsersSpreadsheetRow[],
  existing: ExistingProfileForUsersSpreadsheet[],
): ClassifyUsersSpreadsheetResult {
  const byEmail = new Map<string, string>();
  const byDni = new Map<string, string>();
  for (const p of existing) {
    const e = normEmail(p.email);
    if (e) byEmail.set(e, p.id);
    const d = normDni(p.dni_or_passport);
    if (d) byDni.set(d, p.id);
  }

  const newRows: UsersSpreadsheetRow[] = [];
  const duplicateRows: ClassifiedUsersSpreadsheetDuplicate[] = [];

  for (const row of rows) {
    const emailKey = normEmail(row.email);
    const dniKey = normDni(row.dni_or_passport);
    if (emailKey && byEmail.has(emailKey)) {
      duplicateRows.push({
        row,
        existingId: byEmail.get(emailKey)!,
        match: "email",
      });
      continue;
    }
    if (dniKey && byDni.has(dniKey)) {
      duplicateRows.push({
        row,
        existingId: byDni.get(dniKey)!,
        match: "dni",
      });
      continue;
    }
    newRows.push(row);
  }

  return { newRows, duplicateRows };
}
