import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import dictEn from "@/dictionaries/en.json";
import { TeacherSectionCard } from "@/components/molecules/TeacherSectionCard";

describe("TeacherSectionCard", () => {
  it("renders roster, attendance, and assessment entry links for the same section", () => {
    // REGRESSION CHECK: The sections screen is the single teacher hub for section-scoped work, so each card must expose all core destinations.
    render(
      <TeacherSectionCard
        locale="en"
        sectionId="section-1"
        name="Kids A"
        cohortName="2026"
        scheduleSummary="Mon 18:00"
        activeStudentCount={12}
        dict={dictEn.dashboard.teacherMySections}
      />,
    );

    expect(screen.getByRole("link", { name: "Kids A" })).toHaveAttribute("href", "/en/dashboard/teacher/sections/section-1");
    expect(screen.getByRole("link", { name: dictEn.dashboard.teacherMySections.openRoster })).toHaveAttribute(
      "href",
      "/en/dashboard/teacher/sections/section-1",
    );
    expect(screen.getByRole("link", { name: dictEn.dashboard.teacherMySections.openAttendance })).toHaveAttribute(
      "href",
      "/en/dashboard/teacher/sections/section-1/attendance",
    );
    expect(screen.getByRole("link", { name: dictEn.dashboard.teacherMySections.openAssessments })).toHaveAttribute(
      "href",
      "/en/dashboard/teacher/sections/section-1/assessments",
    );
  });
});
