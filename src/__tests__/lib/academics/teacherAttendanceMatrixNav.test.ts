import { describe, expect, it } from "vitest";
import { defaultMatrixFocus, gridMoveFocus } from "@/lib/academics/teacherAttendanceMatrixNav";
import type { TeacherAttendanceMatrixCells, TeacherAttendanceMatrixRow } from "@/types/teacherAttendanceMatrix";

describe("teacherAttendanceMatrixNav", () => {
  it("defaultMatrixFocus prefers latest class day on or before today, not a future column", () => {
    const rows: TeacherAttendanceMatrixRow[] = [
      {
        enrollmentId: "a",
        studentLabel: "A",
        enrollmentStatus: "active",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    const classDays = ["2026-04-08", "2026-04-15", "2026-04-22"];
    const cells: TeacherAttendanceMatrixCells = {
      a: { "2026-04-08": null, "2026-04-15": null, "2026-04-22": null },
    };
    expect(defaultMatrixFocus(rows, classDays, cells, "2026-04-16")).toEqual({
      enrollmentId: "a",
      dateIso: "2026-04-15",
    });
  });

  it("gridMoveFocus wraps horizontally to the next row", () => {
    const rows: TeacherAttendanceMatrixRow[] = [
      {
        enrollmentId: "a",
        studentLabel: "A",
        enrollmentStatus: "active",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        enrollmentId: "b",
        studentLabel: "B",
        enrollmentStatus: "active",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    const classDays = ["2026-04-13", "2026-04-14"];
    const cells: TeacherAttendanceMatrixCells = {
      a: { "2026-04-13": null, "2026-04-14": null },
      b: { "2026-04-13": null, "2026-04-14": null },
    };
    const next = gridMoveFocus(rows, classDays, cells, { enrollmentId: "a", dateIso: "2026-04-14" }, "ArrowRight");
    expect(next).toEqual({ enrollmentId: "b", dateIso: "2026-04-13" });
  });
});
