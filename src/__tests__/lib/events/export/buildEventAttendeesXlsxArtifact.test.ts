import { describe, expect, it } from "vitest";
import { buildEventAttendeesXlsxArtifact } from "@/lib/events/export/buildEventAttendeesXlsxArtifact";

/** 1x1 PNG */
const TINY_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

describe("buildEventAttendeesXlsxArtifact", () => {
  it("returns an xlsx artifact with letterhead and table rows", async () => {
    const artifact = await buildEventAttendeesXlsxArtifact({
      eventSlug: "workshop-may",
      brand: {
        instituteName: "Golden English",
        legalName: "Golden English SpA",
        legalRegistry: "76.123.456-7",
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#103A5C",
        contactEmail: "hola@example.com",
        contactPhone: "+56222222222",
        contactAddress: "Santiago",
      },
      event: {
        title: "Workshop May",
        eventDateFormatted: "30/05/2026",
        coverImageUrl: "https://example.com/cover.jpg",
        location: "Online",
      },
      meta: {
        documentTitle: "Attendees list",
        eventDate: "Date",
        exportedAt: "Exported at",
        attendeeCount: "Attendees",
        sheetName: "Attendees",
      },
      table: {
        headers: ["Name", "Email", "Photo"],
        rows: [
          [
            { text: "Ana García" },
            { text: "ana@example.com" },
            {
              text: "face.png",
              image: {
                dataUrl: "data:image/png;base64,aaa",
                bytes: TINY_PNG,
                extension: "png",
              },
            },
          ],
        ],
      },
      attendeeCount: 1,
      exportedAtFormatted: "30/05/2026 10:00",
    });

    expect(artifact.filename).toBe("asistentes_workshop-may.xlsx");
    expect(artifact.mimeType).toContain("spreadsheetml");
    expect(artifact.base64.length).toBeGreaterThan(100);
  });
});
