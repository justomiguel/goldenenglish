import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { EventAttendeesExportPdf } from "@/components/dashboard/admin/events/EventAttendeesExportPdf";

describe("EventAttendeesExportPdf", () => {
  it("renderToBuffer yields a PDF header", async () => {
    const doc = (
      <EventAttendeesExportPdf
        brand={{
          instituteName: "Golden English",
          legalName: "Golden English SpA",
          legalRegistry: "",
          logoUrl: "",
          primaryColor: "#103A5C",
          contactEmail: "",
          contactPhone: "",
          contactAddress: "",
        }}
        event={{
          title: "Workshop",
          eventDateFormatted: "30/05/2026",
          coverImageUrl: null,
          location: null,
        }}
        meta={{
          documentTitle: "Attendees list",
          eventDate: "Date",
          exportedAt: "Exported at",
          attendeeCount: "Attendees",
          sheetName: "Attendees",
        }}
        table={{
          headers: ["Name", "Email"],
          rows: [["Ana García", "ana@example.com"]],
        }}
        attendeeCount={1}
        exportedAtFormatted="30/05/2026 10:00"
      />
    );

    const buf = await renderToBuffer(doc);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
