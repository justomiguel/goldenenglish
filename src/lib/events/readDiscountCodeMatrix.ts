import * as XLSX from "xlsx";

const MAX_BYTES = 1_000_000;

export function readDiscountCodeMatrix(fileBase64: string): unknown[][] | null {
  if (!fileBase64 || fileBase64.length > MAX_BYTES) return null;
  const buffer = Buffer.from(fileBase64, "base64");
  const book = XLSX.read(buffer, { type: "buffer" });
  const sheetName = book.SheetNames[0];
  if (!sheetName) return [];
  const sheet = book.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" }) as unknown[][];
}
