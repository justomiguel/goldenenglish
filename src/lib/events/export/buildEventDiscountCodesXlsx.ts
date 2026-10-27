import ExcelJS from "exceljs";

export interface EventDiscountCodeExportRow {
  code: string;
  uses: string;
  percent?: number;
  amount?: number;
  tickets?: number;
}

const PERCENT_EXAMPLES: EventDiscountCodeExportRow[] = [
  { code: "EJEMPLO10", uses: "20", percent: 10 },
  { code: "EJEMPLO50", uses: "N", percent: 50 },
];

const AMOUNT_EXAMPLES: EventDiscountCodeExportRow[] = [
  { code: "EJEMPLO2000", uses: "10", amount: 2000, tickets: 2 },
  { code: "EJEMPLO500", uses: "N", amount: 500, tickets: 1 },
];

/** Header, two example rows, then the real codes of that mode. */
export async function buildEventDiscountCodesXlsx(input: {
  kind: "percent" | "amount";
  rows: EventDiscountCodeExportRow[];
}): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Codes");
  const examples = input.kind === "amount" ? AMOUNT_EXAMPLES : PERCENT_EXAMPLES;
  if (input.kind === "amount") {
    sheet.addRow(["code", "uses", "amount", "tickets", "example"]);
    for (const row of examples) {
      sheet.addRow([row.code, row.uses, row.amount, row.tickets, "yes"]);
    }
    for (const row of input.rows) {
      sheet.addRow([row.code, row.uses, row.amount, row.tickets, ""]);
    }
  } else {
    sheet.addRow(["code", "uses", "percent", "example"]);
    for (const row of examples) {
      sheet.addRow([row.code, row.uses, row.percent, "yes"]);
    }
    for (const row of input.rows) {
      sheet.addRow([row.code, row.uses, row.percent, ""]);
    }
  }
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return buffer.toString("base64");
}
