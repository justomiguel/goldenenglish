import ExcelJS from "exceljs";
import { USERS_SPREADSHEET_COLUMNS } from "@/lib/users/usersSpreadsheetColumns";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";

export type UsersSpreadsheetExportRow = {
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  dni_or_passport: string | null;
  phone: string | null;
  birth_date: string | null;
};

function toBase64(buf: Buffer): string {
  return Buffer.from(buf).toString("base64");
}

export async function buildUsersSpreadsheetXlsx(input: {
  mode: "template" | "data";
  rows: UsersSpreadsheetExportRow[];
}): Promise<{ buffer: Buffer; base64: string; filename: string; mimeType: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = SYSTEM_PROPERTIES_DEFAULTS["app.name"];
  const sheet = workbook.addWorksheet("Users");
  sheet.addRow([...USERS_SPREADSHEET_COLUMNS]);
  if (input.mode === "data") {
    for (const row of input.rows) {
      sheet.addRow([
        row.email,
        row.role,
        row.first_name,
        row.last_name,
        row.dni_or_passport ?? "",
        row.phone ?? "",
        row.birth_date ?? "",
      ]);
    }
  }
  const buf = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    buffer: buf,
    base64: toBase64(buf),
    filename: input.mode === "template" ? "users_template.xlsx" : "users_export.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}
