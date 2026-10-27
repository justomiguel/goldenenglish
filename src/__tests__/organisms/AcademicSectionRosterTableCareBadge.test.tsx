import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionRosterTable } from "@/components/organisms/AcademicSectionRosterTable";
import { dictEn } from "@/test/dictEn";

const surfaceMock = vi.hoisted(() => vi.fn(() => "web-desktop" as "web-desktop" | "pwa-mobile" | "web-mobile"));

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => surfaceMock(),
}));

const dict = dictEn.dashboard.academicSectionPage;

function renderRoster(hasCareNotes: boolean, moveTargets: { id: string; label: string }[] = []) {
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
      moveTargets={moveTargets}
      dict={dict}
      conflictDict={dictEn.dashboard.academics.conflictModal}
      errors={dictEn.dashboard.academics.errors}
    />,
  );
}

// REGRESSION CHECK: Section roster must display localized status labels and render dedicated cards on mobile/PWA surfaces.
describe("AcademicSectionRosterTable care badge and mobile layout", () => {
  beforeEach(() => {
    surfaceMock.mockReturnValue("web-desktop");
  });

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
    expect(screen.getByRole("link", { name: "Ruiz Ana" })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/users/s1",
    );
    expect(screen.queryByLabelText(dict.debtBadge)).not.toBeInTheDocument();
  });

  it("renders localized enrollment status label instead of raw database status", () => {
    renderRoster(false);
    expect(screen.getByText(dict.lifecycle.enrollmentStatus.active)).toBeInTheDocument();
    expect(screen.queryByText("active")).not.toBeInTheDocument();
  });

  it("renders student cards instead of a table on pwa-mobile surface", () => {
    surfaceMock.mockReturnValue("pwa-mobile");
    renderRoster(true, [{ id: "sec-2", label: "Morning B" }]);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ruiz Ana" })).toBeInTheDocument();
    expect(screen.getByText(dict.lifecycle.enrollmentStatus.active)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: dict.moveTitle })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.moveRun })).toBeInTheDocument();
  });
});
