import { describe, it, expect } from "vitest";
import { formatCivilIsoDateForDisplay } from "@/lib/calendar/civilGregorianDate";

describe("formatCivilIsoDateForDisplay (TZ-safe civil date display)", () => {
  it("returns null for null/undefined/empty", () => {
    expect(formatCivilIsoDateForDisplay("es", null)).toBeNull();
    expect(formatCivilIsoDateForDisplay("es", undefined)).toBeNull();
    expect(formatCivilIsoDateForDisplay("es", "")).toBeNull();
  });

  it("renders the civil day stored in DB without ever shifting by TZ", () => {
    // Even if the host (Node, browser) is in a non-UTC zone, "2010-06-13"
    // must show June 13 — not June 12 or June 14. We use UTC inside the
    // formatter so the rendered day matches the stored civil day exactly.
    const out = formatCivilIsoDateForDisplay("en", "2010-06-13", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    // Locale "en" default month short → "Jun 13, 2010"
    expect(out).toContain("13");
    expect(out).toContain("2010");
  });

  it("accepts timestamp-shaped strings by slicing the first 10 chars", () => {
    const out = formatCivilIsoDateForDisplay("es", "2010-06-13T00:00:00.000Z", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    // Locale "es" with numeric parts → "13/6/2010" or "13/06/2010" depending on locale data
    expect(out).toMatch(/^13[\/\-]/);
    expect(out).toContain("2010");
  });

  it("returns null for malformed strings", () => {
    expect(formatCivilIsoDateForDisplay("en", "not-a-date")).toBeNull();
    expect(formatCivilIsoDateForDisplay("en", "2010-13-01")).toBeNull(); // month 13
  });

  it("displays February 29 on leap years without shifting", () => {
    const out = formatCivilIsoDateForDisplay("en", "2024-02-29", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    expect(out).toContain("29");
    expect(out).toContain("2024");
  });
});
