import { describe, expect, it } from "vitest";
import {
  attendancePercent,
  courseResultViews,
  latestAssessmentForSections,
  percentOf,
  taskCountsByCourse,
} from "@/lib/courses/courseResult";

describe("course result lines", () => {
  it("counts completed tasks and ignores a returned task", () => {
    const counts = taskCountsByCourse(
      [{ id: "course", sectionIds: ["section"] }],
      [
        { sectionId: "section", status: "COMPLETED" },
        { sectionId: "section", status: "RETURNED" },
        { sectionId: "other", status: "COMPLETED" },
      ],
    );
    expect(counts.course).toEqual({ completed: 1, total: 2 });
    expect(percentOf(1, 2)).toBe(50);
    expect(percentOf(0, 0)).toBeNull();
  });

  it("leaves attendance empty when there are no rows", () => {
    expect(attendancePercent([])).toBeNull();
    expect(attendancePercent([{ status: "present" }, { status: "absent" }])).toBe(50);
  });

  it("uses the latest graded exam in the course sections", () => {
    const line = latestAssessmentForSections(
      [
        { sectionId: "section", name: "Old", score: 4, maxScore: 10, state: "graded", examOn: "2026-01-01" },
        { sectionId: "section", name: "New", score: 8, maxScore: 10, state: "graded", examOn: "2026-02-01" },
        { sectionId: "other", name: "Other", score: 10, maxScore: 10, state: "graded", examOn: "2026-03-01" },
      ],
      ["section"],
    );
    expect(line).toEqual({ title: "New", score: "8/10" });
  });

  it("builds one view per course from the same attendance month", () => {
    const views = courseResultViews({
      courses: [{ id: "course", sectionIds: ["section"] }],
      tasks: [{ sectionId: "section", status: "COMPLETED" }],
      attendancePercent: 80,
      exams: [
        { sectionId: "section", name: "New", score: 8, maxScore: 10, state: "graded", examOn: "2026-02-01" },
      ],
    });
    expect(views.course).toEqual({
      taskPercent: 100,
      attendancePercent: 80,
      assessment: { title: "New", score: "8/10" },
    });
  });
});
