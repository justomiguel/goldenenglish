import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionStaffAssignedChips } from "@/components/molecules/AcademicSectionStaffAssignedChips";

const dict = {
  heading: "Assigned now",
  leadBadge: "Lead",
  assistantBadge: "Asst.",
  externalBadge: "External",
  empty: "Nobody assigned.",
};

describe("AcademicSectionStaffAssignedChips", () => {
  it("renders empty copy when there is no staff", () => {
    render(
      <AcademicSectionStaffAssignedChips
        leadTeacherLabel={null}
        assistantLabels={[]}
        externalLabels={[]}
        dict={dict}
      />,
    );
    expect(screen.getByText(dict.empty)).toBeVisible();
  });

  it("renders chips for lead, assistants, and externals", () => {
    render(
      <AcademicSectionStaffAssignedChips
        leadTeacherLabel="Jane Doe"
        assistantLabels={["Alex Kim"]}
        externalLabels={["Guest One"]}
        dict={dict}
      />,
    );
    expect(screen.getByText("Jane Doe")).toBeVisible();
    expect(screen.getByText("Alex Kim")).toBeVisible();
    expect(screen.getByText("Guest One")).toBeVisible();
    expect(screen.getByText(dict.leadBadge)).toBeVisible();
  });
});
