import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AcademicCohortFeeDefaultsEditor } from "@/components/organisms/AcademicCohortFeeDefaultsEditor";

const { updateActionMock, refreshMock } = vi.hoisted(() => ({
  updateActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/cohortFeeDefaultsActions", () => ({
  updateAcademicCohortFeeDefaultsAction: updateActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const dict = {
  title: "Default fees",
  lead: "Lead",
  enrollmentLabel: "Default enrollment fee",
  monthlyLabel: "Default monthly fee",
  emptyHint: "Leave empty if unused.",
  save: "Save default fees",
  saved: "Default fees updated.",
  errorSave: "Could not save.",
  errorArchived: "Archived.",
  modeLabel: "How enrollment fees are charged",
  modePerSection: "Per section (accumulate)",
  modeOnceForAll: "Once for the whole cohort",
  modeOnceDisabled: "Once for all is unavailable.",
  errorOnceForAll: "Cannot save once for all.",
};

const COH = "00000000-0000-4000-8000-000000000020";

describe("AcademicCohortFeeDefaultsEditor", () => {
  beforeEach(() => {
    updateActionMock.mockReset();
    refreshMock.mockReset();
  });

  it("saves both defaults and allows clearing them", async () => {
    updateActionMock.mockResolvedValue({ ok: true });
    render(
      <AcademicCohortFeeDefaultsEditor
        locale="en"
        cohortId={COH}
        archived={false}
        initialEnrollment={null}
        initialMonthly={null}
        dict={dict}
      />,
    );
    fireEvent.change(screen.getByLabelText(dict.enrollmentLabel), { target: { value: "80" } });
    fireEvent.change(screen.getByLabelText(dict.monthlyLabel), { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: dict.save }));
    await waitFor(() => {
      expect(updateActionMock).toHaveBeenCalledWith({
        locale: "en",
        cohortId: COH,
        defaultEnrollmentFeeAmount: 80,
        defaultMonthlyFee: 120,
        enrollmentFeeMode: "per_section",
      });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("disables save when the cohort is archived", () => {
    render(
      <AcademicCohortFeeDefaultsEditor
        locale="en"
        cohortId={COH}
        archived
        initialEnrollment={10}
        initialMonthly={20}
        dict={dict}
      />,
    );
    fireEvent.change(screen.getByLabelText(dict.enrollmentLabel), { target: { value: "11" } });
    expect(screen.getByRole("button", { name: dict.save })).toBeDisabled();
  });
});
