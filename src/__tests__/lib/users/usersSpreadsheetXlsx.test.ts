import { describe, expect, it } from "vitest";
import {
  buildUsersSpreadsheetXlsx,
  type UsersSpreadsheetExportRow,
} from "@/lib/users/buildUsersSpreadsheetXlsx";
import { parseUsersSpreadsheetBuffer } from "@/lib/users/parseUsersSpreadsheetFile";
import { USERS_SPREADSHEET_COLUMNS } from "@/lib/users/usersSpreadsheetColumns";

// REGRESSION CHECK: Template and data workbooks must share the same header row for import.
describe("buildUsersSpreadsheetXlsx + parseUsersSpreadsheetBuffer", () => {
  it("builds a template with headers only", async () => {
    const { buffer, filename } = await buildUsersSpreadsheetXlsx({ mode: "template", rows: [] });
    expect(filename).toMatch(/\.xlsx$/);
    const parsed = await parseUsersSpreadsheetBuffer(buffer, "users.xlsx");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.headers).toEqual([...USERS_SPREADSHEET_COLUMNS]);
    expect(parsed.rawRows).toHaveLength(0);
  });

  it("round-trips data rows", async () => {
    const rows: UsersSpreadsheetExportRow[] = [
      {
        email: "ada@school.test",
        role: "teacher",
        first_name: "Ada",
        last_name: "Lovelace",
        dni_or_passport: "30111222",
        phone: "555",
        birth_date: "1990-01-15",
      },
    ];
    const { buffer } = await buildUsersSpreadsheetXlsx({ mode: "data", rows });
    const parsed = await parseUsersSpreadsheetBuffer(buffer, "users.xlsx");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.rawRows).toHaveLength(1);
    expect(parsed.rawRows[0]?.email).toBe("ada@school.test");
    expect(parsed.rawRows[0]?.role).toBe("teacher");
  });

  it("fails when required headers are missing", async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([["email", "first_name"], ["a@b.co", "A"]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const parsed = await parseUsersSpreadsheetBuffer(buffer, "bad.xlsx");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.code).toBe("missing_headers");
  });
});
