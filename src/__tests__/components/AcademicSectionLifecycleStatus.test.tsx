import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionLifecycleStatus } from "@/components/organisms/AcademicSectionLifecycleStatus";

const dict = {
  archivedBanner: "This section is archived.",
  cohortArchivedHint: "The cohort is archived.",
};

describe("AcademicSectionLifecycleStatus", () => {
  it("renders nothing when section and cohort are active", () => {
    const { container } = render(
      <AcademicSectionLifecycleStatus sectionArchivedAt={null} cohortArchivedAt={null} dict={dict} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows archived banner when the section is archived", () => {
    render(<AcademicSectionLifecycleStatus sectionArchivedAt="2026-01-01" cohortArchivedAt={null} dict={dict} />);
    expect(screen.getByText(dict.archivedBanner)).toBeVisible();
  });

  it("shows cohort hint when the cohort is archived", () => {
    render(<AcademicSectionLifecycleStatus sectionArchivedAt={null} cohortArchivedAt="2026-01-01" dict={dict} />);
    expect(screen.getByText(dict.cohortArchivedHint)).toBeVisible();
  });
});
