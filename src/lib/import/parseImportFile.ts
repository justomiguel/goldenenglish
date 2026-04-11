import Papa from "papaparse";

export type ParseImportResult = {
  data: Record<string, unknown>[];
  errors: { message: string }[];
};

/**
 * jsdom's File does not stream real bytes via `text()` / `arrayBuffer()` / `Response(file)`;
 * browsers do. FileReader matches browser behavior and works in tests.
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error ?? new Error("FileReader failed"));
    r.readAsArrayBuffer(file);
  });
}

function readFileAsUtf8Text(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error ?? new Error("FileReader failed"));
    r.readAsText(file, "UTF-8");
  });
}

/**
 * Reads CSV (Papa) or Excel first sheet (SheetJS) into plain row objects.
 */
export async function parseImportFile(file: File): Promise<ParseImportResult> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    try {
      const XLSX = await import("xlsx");
      const buf = await readFileAsArrayBuffer(file);
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        return { data: [], errors: [{ message: "Empty workbook" }] };
      }
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: "",
        raw: false,
      });
      const data = rows.filter((row) =>
        Object.values(row).some((v) => String(v ?? "").trim() !== ""),
      );
      return { data, errors: [] };
    } catch (e) {
      return {
        data: [],
        errors: [{ message: e instanceof Error ? e.message : "Excel read error" }],
      };
    }
  }

  const text = await readFileAsUtf8Text(file);
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: ",",
    transformHeader: (h) => h.trim(),
  });
  return {
    data: parsed.data,
    errors: parsed.errors.map((e) => ({ message: e.message })),
  };
}
