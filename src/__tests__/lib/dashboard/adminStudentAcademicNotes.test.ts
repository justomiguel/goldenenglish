import { describe, expect, it } from "vitest";
import {
  pickLatestAcademicNotes,
  type AdminStudentAcademicNote,
} from "@/lib/dashboard/adminStudentAcademicNotes";

function note(overrides: Partial<AdminStudentAcademicNote>): AdminStudentAcademicNote {
  return {
    id: "n1",
    title: "Quiz",
    sectionName: "A1",
    teacherName: "Lovelace Ada",
    occurredOn: "2026-10-01",
    score: 8,
    maxScore: 10,
    feedback: "Bien",
    ...overrides,
  };
}

describe("pickLatestAcademicNotes", () => {
  it("keeps the newest score or comment and drops empty rows", () => {
    const picked = pickLatestAcademicNotes(
      [
        note({ id: "old", occurredOn: "2026-09-01", feedback: "Viejo" }),
        note({ id: "blank", occurredOn: "2026-10-20", score: null, feedback: "  " }),
        note({ id: "score", occurredOn: "2026-10-10", feedback: "" }),
        note({ id: "comment", occurredOn: "2026-10-12", score: null, feedback: "Revisar" }),
      ],
      2,
    );

    expect(picked.map((item) => item.id)).toEqual(["comment", "score"]);
  });
});
