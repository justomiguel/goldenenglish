import { describe, it, expect } from "vitest";
import { buildAttendanceMatrixMonthGroups } from "@/lib/academics/attendanceMatrixMonthGroups";

describe("buildAttendanceMatrixMonthGroups", () => {
  it("groups consecutive class days by UTC year-month", () => {
    const days = ["2026-03-01", "2026-03-08", "2026-03-15", "2026-04-05", "2026-04-12"];
    const g = buildAttendanceMatrixMonthGroups(days, "en");
    expect(g).toHaveLength(2);
    expect(g[0]!.span).toBe(3);
    expect(g[1]!.span).toBe(2);
    expect(g[0]!.key).toBe("2026-03");
    expect(g[1]!.key).toBe("2026-04");
  });
});
