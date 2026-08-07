import ExcelJS from "exceljs";
import type {
  EventAttendeesExportArtifact,
  EventAttendeesExportBrandHeader,
  EventAttendeesExportEventHeader,
  EventAttendeesExportMetaLabels,
  EventAttendeesExportTable,
} from "@/lib/events/export/eventAttendeesExportTypes";

function safeFilename(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "event"
  );
}

function toBase64(buf: Buffer): string {
  return Buffer.from(buf).toString("base64");
}

export async function buildEventAttendeesXlsxArtifact(input: {
  eventSlug: string;
  brand: EventAttendeesExportBrandHeader;
  event: EventAttendeesExportEventHeader;
  meta: EventAttendeesExportMetaLabels;
  table: EventAttendeesExportTable;
  attendeeCount: number;
  exportedAtFormatted: string;
}): Promise<EventAttendeesExportArtifact> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = input.brand.instituteName;
  const sheet = workbook.addWorksheet(input.meta.sheetName.slice(0, 31));

  const letterhead: string[] = [
    input.brand.instituteName,
    input.brand.legalName,
  ];
  if (input.brand.legalRegistry.trim()) letterhead.push(input.brand.legalRegistry);
  letterhead.push(input.event.title);
  letterhead.push(`${input.meta.eventDate}: ${input.event.eventDateFormatted}`);
  if (input.event.location?.trim()) letterhead.push(input.event.location.trim());
  letterhead.push(`${input.meta.exportedAt}: ${input.exportedAtFormatted}`);
  letterhead.push(`${input.meta.attendeeCount}: ${input.attendeeCount}`);

  for (const line of letterhead) {
    sheet.addRow([line]);
  }
  sheet.addRow([]);

  const headerRowIndex = sheet.rowCount + 1;
  sheet.addRow(input.table.headers);
  sheet.getRow(headerRowIndex).font = { bold: true };

  for (const [rowOffset, row] of input.table.rows.entries()) {
    const excelRowIndex = headerRowIndex + 1 + rowOffset;
    const values = row.map((cell) => cell.text);
    sheet.addRow(values);
    let hasImage = false;
    for (const [colIndex, cell] of row.entries()) {
      if (!cell.image) continue;
      if (cell.image.extension === "webp") continue;
      hasImage = true;
      const imageId = workbook.addImage({
        // ExcelJS Buffer typing differs from Node Buffer across versions.
        buffer: Buffer.from(cell.image.bytes) as unknown as ExcelJS.Buffer,
        extension: cell.image.extension,
      });
      sheet.addImage(imageId, {
        tl: { col: colIndex, row: excelRowIndex - 1 },
        ext: { width: 48, height: 48 },
        editAs: "oneCell",
      });
    }
    if (hasImage) {
      sheet.getRow(excelRowIndex).height = 42;
    }
  }

  sheet.columns.forEach((column) => {
    column.width = Math.min(28, Math.max(12, Number(column.width ?? 14)));
  });

  const buf = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    filename: `asistentes_${safeFilename(input.eventSlug)}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: toBase64(buf),
  };
}
