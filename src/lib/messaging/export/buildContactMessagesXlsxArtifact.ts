import ExcelJS from "exceljs";

export type ContactMessageExportBrand = {
  instituteName: string;
  legalName: string;
  legalRegistry: string;
  logoUrl: string | null;
  primaryColor: string;
};

export type ContactMessageExportArtifact = {
  filename: string;
  mimeType: string;
  base64: string;
};

export type ContactMessageExportFileMeta = {
  documentTitle: string;
  exportedAtLabel: string;
  rowCountLabel: string;
  sheetName: string;
  exportedAt: string;
  rowCount: number;
};

function toBase64(buf: Buffer): string {
  return Buffer.from(buf).toString("base64");
}

export async function buildContactMessagesXlsxArtifact(input: {
  exportedOn: string;
  brand: ContactMessageExportBrand;
  meta: ContactMessageExportFileMeta;
  headers: string[];
  rows: string[][];
}): Promise<ContactMessageExportArtifact> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = input.brand.instituteName;
  const sheet = workbook.addWorksheet(input.meta.sheetName.slice(0, 31) || "Messages");
  const letterhead = [input.brand.instituteName, input.brand.legalName];
  if (input.brand.legalRegistry.trim()) letterhead.push(input.brand.legalRegistry);
  letterhead.push(input.meta.documentTitle);
  letterhead.push(`${input.meta.exportedAtLabel}: ${input.meta.exportedAt}`);
  letterhead.push(`${input.meta.rowCountLabel}: ${input.meta.rowCount}`);
  for (const line of letterhead) sheet.addRow([line]);
  sheet.addRow([]);
  const headerRowIndex = sheet.rowCount + 1;
  sheet.addRow(input.headers);
  sheet.getRow(headerRowIndex).font = { bold: true };
  for (const row of input.rows) sheet.addRow(row);
  sheet.columns.forEach((column, index) => {
    const header = input.headers[index] ?? "";
    column.width = header.length > 12 ? 36 : 18;
  });
  const buf = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    filename: `contact-messages_${input.exportedOn}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: toBase64(buf),
  };
}
