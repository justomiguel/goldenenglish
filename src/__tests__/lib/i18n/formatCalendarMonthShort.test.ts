import { describe, expect, it } from "vitest";
import { formatCalendarMonthShort } from "@/lib/i18n/formatCalendarMonthShort";

// REGRESSION CHECK: month labels must match calendar month 1–12 in the active locale,
// including in American time zones (UTC midnight anchors previously shifted labels).

describe("formatCalendarMonthShort", () => {
  it("maps 1–12 to distinct abbreviated months in es", () => {
    const labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) =>
      formatCalendarMonthShort("es", m).toLowerCase(),
    );
    expect(new Set(labels).size).toBe(12);
    expect(labels[0]).toContain("ene");
    expect(labels[11]).toContain("dic");
  });

  it("clamps out-of-range inputs", () => {
    const low = formatCalendarMonthShort("es", 0).toLowerCase();
    const high = formatCalendarMonthShort("es", 99).toLowerCase();
    expect(low).toContain("ene");
    expect(high).toContain("dic");
  });
});
