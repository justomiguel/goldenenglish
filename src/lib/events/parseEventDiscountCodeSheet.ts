export interface ParsedEventDiscountCode {
  code: string;
  maxUses: number | null;
  discountPercent: number;
}

export interface EventDiscountCodeSheetError {
  row: number;
  code: "duplicate" | "empty_code" | "bad_percent" | "bad_uses" | "cap_below_occupied" | "empty_file";
}

export interface EventDiscountCodeSheetResult {
  rows: ParsedEventDiscountCode[];
  errors: EventDiscountCodeSheetError[];
}

function cellText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function isHeaderUses(value: string): boolean {
  if (!value) return false;
  if (/^n$/i.test(value)) return false;
  if (/^\d+$/.test(value)) return false;
  return true;
}

function parseUses(value: string): number | null | "bad" {
  if (/^n$/i.test(value)) return null;
  if (!/^\d+$/.test(value)) return "bad";
  const uses = Number(value);
  if (!Number.isSafeInteger(uses) || uses < 1) return "bad";
  return uses;
}

function parsePercent(value: string): number | "bad" {
  if (!/^\d+$/.test(value)) return "bad";
  const percent = Number(value);
  if (!Number.isSafeInteger(percent) || percent < 1 || percent > 100) return "bad";
  return percent;
}

/** First row is a header only when the uses cell is text other than N. */
export function parseEventDiscountCodeSheet(
  matrix: unknown[][],
  occupiedByCode: ReadonlyMap<string, number> = new Map(),
): EventDiscountCodeSheetResult {
  const source = matrix.filter((row) => row.some((cell) => cellText(cell) !== ""));
  if (source.length === 0) {
    return { rows: [], errors: [{ row: 0, code: "empty_file" }] };
  }

  const header = isHeaderUses(cellText(source[0]?.[1]));
  const body = header ? source.slice(1) : source;
  if (body.length === 0) {
    return { rows: [], errors: [{ row: 1, code: "empty_file" }] };
  }

  const seen = new Set<string>();
  const rows: ParsedEventDiscountCode[] = [];
  const errors: EventDiscountCodeSheetError[] = [];

  body.forEach((raw, index) => {
    const row = (header ? index + 2 : index + 1);
    const code = cellText(raw[0]);
    const usesCell = cellText(raw[1]);
    const percentCell = cellText(raw[2]);
    if (!code) {
      errors.push({ row, code: "empty_code" });
      return;
    }
    const key = code.toLowerCase();
    if (seen.has(key)) {
      errors.push({ row, code: "duplicate" });
      return;
    }
    seen.add(key);
    const maxUses = parseUses(usesCell);
    if (maxUses === "bad") {
      errors.push({ row, code: "bad_uses" });
      return;
    }
    const discountPercent = parsePercent(percentCell);
    if (discountPercent === "bad") {
      errors.push({ row, code: "bad_percent" });
      return;
    }
    const occupied = occupiedByCode.get(key) ?? 0;
    if (maxUses != null && maxUses < occupied) {
      errors.push({ row, code: "cap_below_occupied" });
      return;
    }
    rows.push({ code, maxUses, discountPercent });
  });

  return { rows, errors };
}
