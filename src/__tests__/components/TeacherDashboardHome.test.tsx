import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeacherDashboardHome } from "@/components/teacher/TeacherDashboardHome";
import dictEn from "@/dictionaries/en.json";

describe("TeacherDashboardHome", () => {
  it("shows retention count and empty today strip", () => {
    // REGRESSION CHECK: Teacher home must keep quick-entry routes discoverable because the sidebar does not point to a global assessments screen.
    const model = {
      todayClasses: [],
      retentionOpenCount: 2,
      familyMessageAttentionCount: 0,
      sectionGrades: [],
    };
    render(<TeacherDashboardHome locale="en" dict={dictEn} model={model} />);
    expect(screen.getByText(dictEn.dashboard.teacher.home.retentionTitle)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(dictEn.dashboard.teacher.home.todayEmpty)).toBeInTheDocument();
  });

  it("links today's class and section grade rows to attendance and assessments", () => {
    const model = {
      todayClasses: [{ sectionId: "sec-1", label: "Kids A", startTime: "18:00", endTime: "19:00" }],
      retentionOpenCount: 0,
      familyMessageAttentionCount: 0,
      sectionGrades: [{ sectionId: "sec-1", label: "Kids A", avgScore: 8.5 }],
    };

    render(<TeacherDashboardHome locale="en" dict={dictEn} model={model} />);

    expect(screen.getByRole("link", { name: dictEn.dashboard.teacher.home.takeAttendanceCta })).toHaveAttribute(
      "href",
      "/en/dashboard/teacher/sections/sec-1/attendance",
    );
    expect(screen.getByRole("link", { name: dictEn.dashboard.teacher.home.openAssessmentsCta })).toHaveAttribute(
      "href",
      "/en/dashboard/teacher/sections/sec-1/assessments",
    );
    expect(screen.getByRole("link", { name: dictEn.dashboard.teacher.home.gradesOpenAssessments })).toHaveAttribute(
      "href",
      "/en/dashboard/teacher/sections/sec-1/assessments",
    );
  });
});
