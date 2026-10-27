export type ParsedEventDiscountCode =
  | {
      code: string;
      maxUses: number | null;
      kind: "percent";
      discountPercent: number;
    }
  | {
      code: string;
      maxUses: number | null;
      kind: "amount";
      discountAmount: number;
      ticketCount: number;
    };

export interface EventDiscountCodeSheetError {
  row: number;
  code:
    | "duplicate"
    | "empty_code"
    | "bad_percent"
    | "bad_uses"
    | "bad_amount"
    | "bad_tickets"
    | "cap_below_occupied"
    | "empty_file"
    | "examples_only"
    | "wrong_file";
}

export interface EventDiscountCodeSheetResult {
  rows: ParsedEventDiscountCode[];
  errors: EventDiscountCodeSheetError[];
}

export interface ParseEventDiscountCodeSheetOptions {
  kind?: "percent" | "amount";
  currency?: string;
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

function isExampleCell(value: string): boolean {
  return /^(yes|si|sí|exemplo)$/i.test(value);
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

function parseAmount(value: string, currency: string): number | "bad" {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return "bad";
  const amount = Number(value);
  if (!(amount > 0) || amount > 99999999.99) return "bad";
  const zeroDecimal = currency.trim().toUpperCase() === "CLP" || currency.trim().toUpperCase() === "ARS";
  if (zeroDecimal && !Number.isInteger(amount)) return "bad";
  return amount;
}

function parseTickets(value: string): number | "bad" {
  if (!/^\d+$/.test(value)) return "bad";
  const tickets = Number(value);
  if (!Number.isSafeInteger(tickets) || tickets < 1 || tickets > 10000) return "bad";
  return tickets;
}

function headerNames(row: unknown[]): string[] {
  return row.map((cell) => cellText(cell).toLowerCase());
}

function columnIndex(names: string[], label: string, fallback: number): number {
  const index = names.indexOf(label);
  return index >= 0 ? index : fallback;
}

/** First row is a header only when the uses cell is text other than N. */
export function parseEventDiscountCodeSheet(
  matrix: unknown[][],
  occupiedByCode: ReadonlyMap<string, number> = new Map(),
  options: ParseEventDiscountCodeSheetOptions = {},
): EventDiscountCodeSheetResult {
  const kind = options.kind ?? "percent";
  const currency = options.currency ?? "";
  const source = matrix.filter((row) => row.some((cell) => cellText(cell) !== ""));
  if (source.length === 0) {
    return { rows: [], errors: [{ row: 0, code: "empty_file" }] };
  }

  const names = headerNames(source[0] ?? []);
  const amountFile = names.includes("amount") && names.includes("tickets");
  if (kind === "amount" && !amountFile) {
    return { rows: [], errors: [{ row: 1, code: "wrong_file" }] };
  }
  if (kind === "percent" && amountFile) {
    return { rows: [], errors: [{ row: 1, code: "wrong_file" }] };
  }

  const header = kind === "amount" || isHeaderUses(cellText(source[0]?.[1])) || names[0] === "code";
  const body = header ? source.slice(1) : source;
  if (body.length === 0) {
    return { rows: [], errors: [{ row: 1, code: "empty_file" }] };
  }

  const usesIndex = columnIndex(names, "uses", 1);
  const percentIndex = columnIndex(names, "percent", 2);
  const amountIndex = columnIndex(names, "amount", 2);
  const ticketsIndex = columnIndex(names, "tickets", 3);
  const exampleIndex = columnIndex(names, "example", kind === "amount" ? 4 : 3);

  const seen = new Set<string>();
  const rows: ParsedEventDiscountCode[] = [];
  const errors: EventDiscountCodeSheetError[] = [];
  let skippedExamples = 0;

  body.forEach((raw, index) => {
    const row = header ? index + 2 : index + 1;
    if (isExampleCell(cellText(raw[exampleIndex]))) {
      skippedExamples += 1;
      return;
    }
    const code = cellText(raw[0]);
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
    const maxUses = parseUses(cellText(raw[usesIndex]));
    if (maxUses === "bad") {
      errors.push({ row, code: "bad_uses" });
      return;
    }
    const occupied = occupiedByCode.get(key) ?? 0;
    if (maxUses != null && maxUses < occupied) {
      errors.push({ row, code: "cap_below_occupied" });
      return;
    }
    if (kind === "amount") {
      const discountAmount = parseAmount(cellText(raw[amountIndex]), currency);
      if (discountAmount === "bad") {
        errors.push({ row, code: "bad_amount" });
        return;
      }
      const ticketCount = parseTickets(cellText(raw[ticketsIndex]));
      if (ticketCount === "bad") {
        errors.push({ row, code: "bad_tickets" });
        return;
      }
      rows.push({ code, maxUses, kind: "amount", discountAmount, ticketCount });
      return;
    }
    const discountPercent = parsePercent(cellText(raw[percentIndex]));
    if (discountPercent === "bad") {
      errors.push({ row, code: "bad_percent" });
      return;
    }
    rows.push({ code, maxUses, kind: "percent", discountPercent });
  });

  if (rows.length === 0 && errors.length === 0 && skippedExamples > 0) {
    return { rows: [], errors: [{ row: 2, code: "examples_only" }] };
  }
  return { rows, errors };
}
