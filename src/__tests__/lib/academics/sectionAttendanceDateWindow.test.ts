import { describe, expect, it } from "vitest";
import {
  isTeacherAttendanceDateAllowed,
  minTeacherAttendanceDateIso,
  utcCalendarDateIso,
} from "@/lib/academics/sectionAttendanceDateWindow";

describe("sectionAttendanceDateWindow", () => {
  it("allows today and two prior UTC days", () => {
    const now = new Date(Date.UTC(2026, 5, 15, 12, 0, 0));
    const min = minTeacherAttendanceDateIso(now);
    const max = utcCalendarDateIso(now);
    expect(min).toBe("2026-06-13");
    expect(max).toBe("2026-06-15");
    expect(isTeacherAttendanceDateAllowed("2026-06-13", now)).toBe(true);
    expect(isTeacherAttendanceDateAllowed("2026-06-12", now)).toBe(false);
  });
});
