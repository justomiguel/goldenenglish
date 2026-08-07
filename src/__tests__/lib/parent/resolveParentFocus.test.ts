import { describe, expect, it } from "vitest";
import type { ParentFocusCatalog } from "@/lib/parent/parentFocusTypes";
import { resolveParentFocus } from "@/lib/parent/resolveParentFocus";

const catalog: ParentFocusCatalog = {
  students: [
    { studentId: "s1", displayName: "Ana" },
    { studentId: "s2", displayName: "Bruno" },
  ],
  sectionsByStudentId: {
    s1: [
      { sectionId: "sec-a", classLabel: "Teens — A1" },
      { sectionId: "sec-b", classLabel: "Kids — B1" },
    ],
    s2: [{ sectionId: "sec-c", classLabel: "Adults — C1" }],
  },
};

describe("resolveParentFocus", () => {
  it("returns empty focus when there are no students", () => {
    expect(
      resolveParentFocus({ students: [], sectionsByStudentId: {} }, {}),
    ).toEqual({
      studentId: null,
      sectionId: null,
      student: null,
      sectionsForStudent: [],
      section: null,
    });
  });

  it("defaults to the first student and first section", () => {
    const focus = resolveParentFocus(catalog, {});
    expect(focus.studentId).toBe("s1");
    expect(focus.sectionId).toBe("sec-a");
    expect(focus.student?.displayName).toBe("Ana");
    expect(focus.section?.classLabel).toBe("Teens — A1");
    expect(focus.sectionsForStudent).toHaveLength(2);
  });

  it("honors a valid studentId + sectionId pair", () => {
    const focus = resolveParentFocus(catalog, {
      studentId: "s1",
      sectionId: "sec-b",
    });
    expect(focus.studentId).toBe("s1");
    expect(focus.sectionId).toBe("sec-b");
  });

  it("falls back to first student when studentId is invalid", () => {
    const focus = resolveParentFocus(catalog, { studentId: "missing" });
    expect(focus.studentId).toBe("s1");
    expect(focus.sectionId).toBe("sec-a");
  });

  it("falls back to first section when sectionId is invalid for the student", () => {
    const focus = resolveParentFocus(catalog, {
      studentId: "s2",
      sectionId: "sec-a",
    });
    expect(focus.studentId).toBe("s2");
    expect(focus.sectionId).toBe("sec-c");
  });

  it("returns null sectionId when the student has no active sections", () => {
    const focus = resolveParentFocus(
      {
        students: [{ studentId: "s9", displayName: "Solo" }],
        sectionsByStudentId: {},
      },
      { studentId: "s9", sectionId: "sec-a" },
    );
    expect(focus.studentId).toBe("s9");
    expect(focus.sectionId).toBeNull();
    expect(focus.section).toBeNull();
    expect(focus.sectionsForStudent).toEqual([]);
  });
});
