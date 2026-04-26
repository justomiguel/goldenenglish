import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminAcademicContentsScreen } from "@/components/admin/AdminAcademicContentsScreen";
import { dictEn } from "@/test/dictEn";

const section = {
  id: "00000000-0000-4000-8000-000000000001",
  label: "A1 - Morning",
  cohortName: "A1",
};

describe("AdminAcademicContentsScreen", () => {
  it("asks what to create before showing the section selector", () => {
    render(
      <AdminAcademicContentsScreen
        locale="en"
        sections={[section]}
        selectedSectionId={section.id}
        workspace={null}
        globalContents={[]}
        labels={dictEn.dashboard.adminContents}
      />,
    );

    expect(screen.getByText(dictEn.dashboard.adminContents.globalModeTitle)).toBeInTheDocument();
    expect(screen.queryByLabelText(dictEn.dashboard.adminContents.sectionLabel)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(dictEn.dashboard.adminContents.sectionModeTitle));

    expect(screen.getByLabelText(dictEn.dashboard.adminContents.sectionLabel)).toBeInTheDocument();
  });
});
