import { describe, it, expect } from "vitest";
import { dictEn } from "@/test/dictEn";
import {
  parentAttendancePwaLabel,
  recentMarksToggleAria,
} from "@/lib/parent/parentAttendancePwaLabelHelpers";

describe("parentAttendancePwaLabelHelpers", () => {
  const labels = dictEn.dashboard.parent.attendancePwa;

  it("uses dictionary strings when present", () => {
    expect(parentAttendancePwaLabel(labels, "recentMarksExpandAria")).toBe(
      labels.recentMarksExpandAria,
    );
  });

  it("falls back when a key is missing", () => {
    const partial = { ...labels, recentMarksExpandAria: undefined } as typeof labels;
    expect(parentAttendancePwaLabel(partial, "recentMarksExpandAria")).toContain("{count}");
  });

  it("builds expand/collapse aria labels", () => {
    expect(recentMarksToggleAria(labels, false, 2, "Kids A")).toBe(
      labels.recentMarksExpandAria.replace("{count}", "2").replace("{section}", "Kids A"),
    );
  });
});
