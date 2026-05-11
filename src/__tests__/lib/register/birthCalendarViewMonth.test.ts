import { describe, expect, it } from "vitest";

import { clampBirthCalendarViewMonth, startOfUtcMonth } from "@/lib/register/birthCalendarViewMonth";

describe("birthCalendarViewMonth", () => {
  it("clampBirthCalendarViewMonth stays within earliest and latest first-of-month bounds", () => {
    const earliest = new Date(2010, 0, 1);
    const latest = new Date(2020, 5, 1);
    expect(clampBirthCalendarViewMonth(new Date(2009, 6, 15), earliest, latest)).toEqual(earliest);
    expect(startOfUtcMonth(new Date(2015, 3, 20))).toEqual(new Date(2015, 3, 1));
    expect(clampBirthCalendarViewMonth(new Date(2025, 0, 1), earliest, latest)).toEqual(latest);
  });
});
