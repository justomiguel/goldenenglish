import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionRosterTable } from "@/components/organisms/AcademicSectionRosterTable";
import { dictEn } from "@/test/dictEn";

const dict = dictEn.dashboard.academicSectionPage;

function renderRoster(hasCareNotes: boolean) {
  return render(
    <AcademicSectionRosterTable
      locale="en"
      sectionId="sec-1"
      rows={[
        {
          enrollmentId: "e1",
          studentId: "s1",
          label: "Ruiz Ana",
          status: "active",
          hasCareNotes,
        },
      ]}
      moveTargets={[]}
      dict={dict}
      conflictDict={dictEn.dashboard.academics.conflictModal}
      errors={dictEn.dashboard.academics.errors}
    />,
  );
}

describe("AcademicSectionRosterTable care badge", () => {
  it("marks a student who needs care", () => {
    renderRoster(true);
    expect(screen.getByLabelText(dict.careBadge)).toBeInTheDocument();
  });

  it("shows nothing for a student who does not", () => {
    renderRoster(false);
    expect(screen.queryByLabelText(dict.careBadge)).not.toBeInTheDocument();
  });

  it("does not disturb the debt badge that already lives in that cell", () => {
    renderRoster(true);
    expect(screen.getByText("Ruiz Ana")).toBeInTheDocument();
    expect(screen.queryByLabelText(dict.debtBadge)).not.toBeInTheDocument();
  });
});
