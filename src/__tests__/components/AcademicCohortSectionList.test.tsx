import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicCohortSectionList } from "@/components/molecules/AcademicCohortSectionList";

const labels = {
  section: "Section",
  teachers: "Teachers",
  schedule: "Schedule",
  emptyTeachers: "No teacher",
  emptySchedule: "No schedule",
  actions: "Actions",
};

describe("AcademicCohortSectionList", () => {
  it("lists the teacher names and the schedule in one row", () => {
    render(
      <AcademicCohortSectionList
        locale="en"
        capacityLabel="Capacity"
        labels={labels}
        rows={[
          {
            id: "s1",
            href: "/en/dashboard/admin/academic/c/s1",
            name: "Monday group",
            teacherNames: ["Vargas Ana", "Perez Luis"],
            scheduleLine: "Mon 18:00–19:30",
            activeCount: 8,
            maxStudents: 12,
          },
        ]}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Monday group" })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/c/s1",
    );
    expect(screen.getByText("Vargas Ana and Perez Luis")).toBeInTheDocument();
    expect(screen.getByText("Mon 18:00–19:30")).toBeInTheDocument();
  });

  it("names the empty teacher and schedule cells", () => {
    render(
      <AcademicCohortSectionList
        locale="en"
        capacityLabel="Capacity"
        labels={labels}
        rows={[
          {
            id: "s2",
            href: "/en/dashboard/admin/academic/c/s2",
            name: "Empty group",
            teacherNames: [],
            scheduleLine: "",
            activeCount: 0,
            maxStudents: 10,
          },
        ]}
      />,
    );

    expect(screen.getByText("No teacher")).toBeInTheDocument();
    expect(screen.getByText("No schedule")).toBeInTheDocument();
  });
});
