/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { AdminStudentAcademicNotes } from "@/components/molecules/AdminStudentAcademicNotes";

describe("AdminStudentAcademicNotes", () => {
  it("shows the score and the teacher comment", () => {
    render(
      <AdminStudentAcademicNotes
        locale="en"
        labels={en.admin.users}
        notes={[
          {
            id: "grade-1",
            title: "Unit test",
            sectionName: "B1",
            teacherName: "Hopper Grace",
            occurredOn: "2026-10-20",
            score: 9,
            maxScore: 10,
            feedback: "Clear answers.",
          },
        ]}
      />,
    );

    expect(screen.getByText("Unit test")).toBeInTheDocument();
    expect(screen.getByText("9 / 10")).toBeInTheDocument();
    expect(screen.getByText("Clear answers.")).toBeInTheDocument();
    expect(screen.getByText(/Hopper Grace/)).toBeInTheDocument();
    expect(screen.getByText(/B1/)).toBeInTheDocument();
  });

  it("shows an empty state when the student has no published notes", () => {
    render(
      <AdminStudentAcademicNotes locale="en" labels={en.admin.users} notes={[]} />,
    );

    expect(screen.getByText(en.admin.users.detailAcademicNotesEmpty)).toBeInTheDocument();
  });
});
