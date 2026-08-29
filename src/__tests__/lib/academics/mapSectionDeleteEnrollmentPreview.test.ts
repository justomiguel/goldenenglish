import { describe, expect, it } from "vitest";
import { mapSectionDeleteEnrollmentPreview } from "@/lib/academics/mapSectionDeleteEnrollmentPreview";

describe("mapSectionDeleteEnrollmentPreview", () => {
  it("labels and sorts enrollments by surname then given name", () => {
    const rows = mapSectionDeleteEnrollmentPreview([
      {
        id: "e2",
        status: "dropped",
        student_id: "s2",
        profiles: { first_name: "Ana", last_name: "Pérez" },
      },
      {
        id: "e1",
        status: "active",
        student_id: "s1",
        profiles: { first_name: "Luis", last_name: "García" },
      },
    ]);

    expect(rows).toEqual([
      { id: "e1", studentId: "s1", label: "García Luis", status: "active" },
      { id: "e2", studentId: "s2", label: "Pérez Ana", status: "dropped" },
    ]);
  });

  it("unwraps array profile joins and falls back to the student id", () => {
    const rows = mapSectionDeleteEnrollmentPreview([
      {
        id: "e3",
        status: "transferred",
        student_id: "s3",
        profiles: [{ first_name: "Marta", last_name: "López" }],
      },
      {
        id: "e4",
        status: "active",
        student_id: "s4",
        profiles: null,
      },
    ]);

    expect(rows.map((r) => r.label)).toEqual(["López Marta", "s4"]);
  });
});
