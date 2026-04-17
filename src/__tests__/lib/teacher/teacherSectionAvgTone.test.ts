import { describe, expect, it } from "vitest";
import { teacherSectionAvgTone } from "@/lib/teacher/teacherSectionAvgTone";

describe("teacherSectionAvgTone", () => {
  it("returns neutral for null/NaN/undefined", () => {
    expect(teacherSectionAvgTone(null)).toBe("neutral");
    expect(teacherSectionAvgTone(undefined)).toBe("neutral");
    expect(teacherSectionAvgTone(Number.NaN)).toBe("neutral");
  });

  it("returns ok for averages ≥ 7", () => {
    expect(teacherSectionAvgTone(7)).toBe("ok");
    expect(teacherSectionAvgTone(8.5)).toBe("ok");
    expect(teacherSectionAvgTone(10)).toBe("ok");
  });

  it("returns warning for averages between 5 and 6.99", () => {
    expect(teacherSectionAvgTone(5)).toBe("warning");
    expect(teacherSectionAvgTone(6.99)).toBe("warning");
  });

  it("returns danger for averages below 5", () => {
    expect(teacherSectionAvgTone(4.99)).toBe("danger");
    expect(teacherSectionAvgTone(0)).toBe("danger");
  });
});
