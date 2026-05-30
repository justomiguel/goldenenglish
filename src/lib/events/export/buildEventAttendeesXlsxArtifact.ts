import * as XLSX from "xlsx";
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

function toBase64(value: string | Uint8Array): string {
  return typeof value === "string"
    ? Buffer.from(value, "utf-8").toString("base64")
    : Buffer.from(value).toString("base64");
}

function buildLetterheadRows(input: {
  brand: EventAttendeesExportBrandHeader;
  event: EventAttendeesExportEventHeader;
  meta: EventAttendeesExportMetaLabels;
  attendeeCount: number;
  exportedAtFormatted: string;
}): string[][] {
  const rows: string[][] = [[input.brand.instituteName], [input.brand.legalName]];
  if (input.brand.legalRegistry.trim()) {
    rows.push([input.brand.legalRegistry]);
  }
  rows.push([input.event.title]);
  rows.push([`${input.meta.eventDate}: ${input.event.eventDateFormatted}`]);
  if (input.event.location?.trim()) {
    rows.push([input.event.location.trim()]);
  }
  rows.push([`${input.meta.exportedAt}: ${input.exportedAtFormatted}`]);
  rows.push([`${input.meta.attendeeCount}: ${input.attendeeCount}`]);
  if (input.brand.logoUrl.trim()) {
    rows.push([input.brand.logoUrl.trim()]);
  }
  if (input.event.coverImageUrl?.trim()) {
    rows.push([input.event.coverImageUrl.trim()]);
  }
  rows.push([]);
  return rows;
}

export function buildEventAttendeesXlsxArtifact(input: {
  eventSlug: string;
  brand: EventAttendeesExportBrandHeader;
  event: EventAttendeesExportEventHeader;
  meta: EventAttendeesExportMetaLabels;
  table: EventAttendeesExportTable;
  attendeeCount: number;
  exportedAtFormatted: string;
}): EventAttendeesExportArtifact {
  const letterhead = buildLetterheadRows({
    brand: input.brand,
    event: input.event,
    meta: input.meta,
    attendeeCount: input.attendeeCount,
    exportedAtFormatted: input.exportedAtFormatted,
  });
  const ws = XLSX.utils.aoa_to_sheet([...letterhead, input.table.headers, ...input.table.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, input.meta.sheetName.slice(0, 31));

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return {
    filename: `asistentes_${safeFilename(input.eventSlug)}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: toBase64(buf),
  };
}
