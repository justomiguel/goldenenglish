import {
  assertUsersSpreadsheetHeaders,
  normalizeUsersSpreadsheetHeader,
  USERS_SPREADSHEET_COLUMNS,
} from "@/lib/users/usersSpreadsheetColumns";

export type ParseUsersSpreadsheetOk = {
  ok: true;
  headers: string[];
  rawRows: Record<string, unknown>[];
};

export type ParseUsersSpreadsheetErr = {
  ok: false;
  code: "missing_headers" | "empty_workbook" | "parse_failed";
  missing?: string[];
};

export type ParseUsersSpreadsheetResult = ParseUsersSpreadsheetOk | ParseUsersSpreadsheetErr;

function headerRowFromSheet(rows: unknown[][]): string[] | null {
  const first = rows[0];
  if (!first || first.length === 0) return null;
  return first.map((c) => normalizeUsersSpreadsheetHeader(String(c ?? "")));
}

/**
 * Parse an xlsx/xls ArrayBuffer/Buffer into raw row objects keyed by canonical headers.
 * Does not create users — header gate only.
 */
export async function parseUsersSpreadsheetBuffer(
  buffer: ArrayBuffer | Buffer,
  fileName: string,
): Promise<ParseUsersSpreadsheetResult> {
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { ok: false, code: "empty_workbook" };
    const ws = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
      raw: false,
    });
    if (!aoa.length) return { ok: false, code: "empty_workbook" };
    const headers = headerRowFromSheet(aoa);
    if (!headers) return { ok: false, code: "empty_workbook" };

    const gate = assertUsersSpreadsheetHeaders(headers);
    if (!gate.ok) {
      return { ok: false, code: "missing_headers", missing: gate.missing };
    }

    const headerIndex = new Map<string, number>();
    headers.forEach((h, i) => {
      if (USERS_SPREADSHEET_COLUMNS.includes(h as (typeof USERS_SPREADSHEET_COLUMNS)[number])) {
        headerIndex.set(h, i);
      }
    });

    const rawRows: Record<string, unknown>[] = [];
    for (let r = 1; r < aoa.length; r++) {
      const line = aoa[r] ?? [];
      const obj: Record<string, unknown> = {};
      let any = false;
      for (const col of USERS_SPREADSHEET_COLUMNS) {
        const idx = headerIndex.get(col);
        const val = idx === undefined ? "" : String(line[idx] ?? "").trim();
        obj[col] = val;
        if (val !== "") any = true;
      }
      if (any) rawRows.push(obj);
    }

    return { ok: true, headers: [...USERS_SPREADSHEET_COLUMNS], rawRows };
  } catch {
    return { ok: false, code: "parse_failed", ...(fileName ? {} : {}) };
  }
}

export async function parseUsersSpreadsheetFile(file: File): Promise<ParseUsersSpreadsheetResult> {
  const buf = await file.arrayBuffer();
  return parseUsersSpreadsheetBuffer(buf, file.name);
}
