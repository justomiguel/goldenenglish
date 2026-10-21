import ExcelJS from "exceljs";

export async function buildEventDiscountCodesXlsx(
  rows: { code: string; uses: string; percent: number }[],
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Codes");
  sheet.addRow(["code", "uses", "percent"]);
  for (const row of rows) {
    sheet.addRow([row.code, row.uses, row.percent]);
  }
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return buffer.toString("base64");
}
