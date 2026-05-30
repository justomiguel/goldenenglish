import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { EventAttendeesExportPdf } from "@/components/dashboard/admin/events/EventAttendeesExportPdf";
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

export async function buildEventAttendeesPdfArtifact(input: {
  eventSlug: string;
  brand: EventAttendeesExportBrandHeader;
  event: EventAttendeesExportEventHeader;
  meta: EventAttendeesExportMetaLabels;
  table: EventAttendeesExportTable;
  attendeeCount: number;
  exportedAtFormatted: string;
}): Promise<EventAttendeesExportArtifact> {
  const doc = (
    <EventAttendeesExportPdf
      brand={input.brand}
      event={input.event}
      meta={input.meta}
      table={input.table}
      attendeeCount={input.attendeeCount}
      exportedAtFormatted={input.exportedAtFormatted}
    />
  );
  const pdfBuffer = await renderToBuffer(doc);
  return {
    filename: `asistentes_${safeFilename(input.eventSlug)}.pdf`,
    mimeType: "application/pdf",
    base64: toBase64(pdfBuffer),
  };
}
