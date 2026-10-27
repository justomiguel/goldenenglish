/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { AdminStudentAcademicExams } from "@/components/molecules/AdminStudentAcademicExams";
import type { StudentExamResult } from "@/types/studentExams";

const labels = en.admin.users;

function exam(overrides: Partial<StudentExamResult> = {}): StudentExamResult {
  return {
    id: "exam-1",
    name: "Unit 3 exam",
    sectionId: "sec-1",
    sectionName: "B1",
    examOn: "2026-11-02",
    maxScore: 10,
    score: null,
    hasTeacherFeedback: false,
    state: "upcoming",
    ...overrides,
  };
}

describe("AdminStudentAcademicExams", () => {
  it("shows a published score and an exam that has no score yet", () => {
    render(
      <AdminStudentAcademicExams
        locale="en"
        labels={labels}
        exams={[
          exam({ id: "graded", name: "Unit 2 exam", state: "graded", score: 8, examOn: "2026-10-01" }),
          exam({ id: "pending", name: "Unit 3 exam", state: "pending", score: null, examOn: "2026-10-20" }),
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: labels.detailAcademicExamsTitle })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Unit 2 exam" })).toHaveAttribute(
      "href",
      "/en/dashboard/teacher/sections/sec-1/assessments/graded",
    );
    expect(screen.getByRole("link", { name: "Unit 3 exam" })).toHaveAttribute(
      "href",
      "/en/dashboard/teacher/sections/sec-1/assessments/pending",
    );
    expect(screen.getByText("8 / 10")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(labels.detailAcademicExamsGraded))).toBeInTheDocument();
    expect(screen.getByText("Unit 3 exam")).toBeInTheDocument();
    expect(screen.getByText(labels.detailAcademicExamsPending)).toBeInTheDocument();
    expect(screen.getAllByText(/B1/).length).toBe(2);
  });

  it("shows an empty state when the student has no exams", () => {
    render(<AdminStudentAcademicExams locale="en" labels={labels} exams={[]} />);

    expect(screen.getByText(labels.detailAcademicExamsEmpty)).toBeInTheDocument();
  });
});
