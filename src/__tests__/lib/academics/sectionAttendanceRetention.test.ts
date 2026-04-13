import { describe, expect, it } from "vitest";
import { countTrailingAbsences } from "@/lib/academics/sectionAttendanceRetention";

describe("countTrailingAbsences", () => {
  it("returns 0 when newest is not absent", () => {
    expect(
      countTrailingAbsences([
        { attended_on: "2026-04-10", status: "present" },
        { attended_on: "2026-04-09", status: "absent" },
      ]),
    ).toBe(0);
  });

  it("counts leading absences in newest-first order", () => {
    expect(
      countTrailingAbsences([
        { attended_on: "2026-04-10", status: "absent" },
        { attended_on: "2026-04-09", status: "absent" },
        { attended_on: "2026-04-08", status: "present" },
      ]),
    ).toBe(2);
  });

  it("stops at first non-absent after absences", () => {
    expect(
      countTrailingAbsences([
        { attended_on: "2026-04-10", status: "absent" },
        { attended_on: "2026-04-09", status: "late" },
        { attended_on: "2026-04-08", status: "absent" },
      ]),
    ).toBe(1);
  });
});
