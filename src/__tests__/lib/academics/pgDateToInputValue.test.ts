import { describe, expect, it } from "vitest";

import { pgDateToInputValue, sectionCalendarDateIsoOrNull } from "@/lib/academics/pgDateToInputValue";

describe("pgDateToInputValue", () => {
  it("returns YYYY-MM-DD slice for ISO timestamps", () => {
    expect(pgDateToInputValue("2026-04-01T00:00:00.000Z")).toBe("2026-04-01");
  });

  it("accepts plain date strings", () => {
    expect(pgDateToInputValue("2026-04-01")).toBe("2026-04-01");
  });

  it("returns empty for invalid", () => {
    expect(pgDateToInputValue(null)).toBe("");
    expect(pgDateToInputValue("nope")).toBe("");
  });

  it("sectionCalendarDateIsoOrNull returns null for empty", () => {
    expect(sectionCalendarDateIsoOrNull(null)).toBeNull();
    expect(sectionCalendarDateIsoOrNull("2026-05-01T12:00:00.000Z")).toBe("2026-05-01");
  });
});
