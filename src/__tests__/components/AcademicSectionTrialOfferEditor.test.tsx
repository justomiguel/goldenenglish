import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AcademicSectionTrialOfferEditor } from "@/components/organisms/AcademicSectionTrialOfferEditor";

const { setActionMock, refreshMock } = vi.hoisted(() => ({
  setActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionTrialOfferActions", () => ({
  setSectionTrialOfferAction: setActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const dict = {
  title: "Trial class",
  lead: "Override the cohort default.",
  offersLabel: "Offer a trial class",
  offersInherit: "Use the cohort default",
  offersYes: "Yes — list this section",
  offersNo: "No — hide this section",
  amountLabel: "Trial class fee",
  inheritHint: "Empty uses the cohort default ({amount}).",
  inheritEmpty: "Leave empty to inherit.",
  zeroMeans: "0 means free.",
  save: "Save trial class offer",
  saved: "Trial class offer updated.",
  errorSave: "Could not save.",
};

const SECTION = "00000000-0000-4000-8000-000000000010";

describe("AcademicSectionTrialOfferEditor", () => {
  beforeEach(() => {
    setActionMock.mockReset();
    refreshMock.mockReset();
  });

  it("saves a free override", async () => {
    setActionMock.mockResolvedValue({ ok: true });
    render(
      <AcademicSectionTrialOfferEditor
        locale="en"
        sectionId={SECTION}
        initialOffersTrial={null}
        initialTrialFeeAmount={null}
        cohortOffersTrial
        cohortTrialFeeAmount={10}
        dict={dict}
      />,
    );
    fireEvent.click(screen.getByLabelText(dict.offersYes));
    fireEvent.change(screen.getByLabelText(dict.amountLabel), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: dict.save }));
    await waitFor(() => {
      expect(setActionMock).toHaveBeenCalledWith({
        locale: "en",
        sectionId: SECTION,
        offersTrial: true,
        trialFeeAmount: 0,
      });
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});
