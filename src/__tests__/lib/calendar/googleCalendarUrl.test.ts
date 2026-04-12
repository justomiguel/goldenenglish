import { describe, it, expect } from "vitest";
import { googleCalendarEventUrl } from "@/lib/calendar/googleCalendarUrl";

describe("googleCalendarEventUrl", () => {
  it("includes action TEMPLATE and dates range", () => {
    const start = new Date("2026-06-01T15:00:00.000Z");
    const end = new Date("2026-06-01T16:00:00.000Z");
    const u = googleCalendarEventUrl({
      title: "Clase",
      details: "Detalle",
      start,
      end,
    });
    expect(u).toContain("calendar.google.com");
    expect(u).toContain("action=TEMPLATE");
    expect(u).toContain("text=Clase");
    expect(u).toContain("dates=");
  });
});
