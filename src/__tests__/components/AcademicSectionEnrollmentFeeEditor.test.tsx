import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AcademicSectionEnrollmentFeeEditor } from "@/components/organisms/AcademicSectionEnrollmentFeeEditor";

const { setActionMock, refreshMock } = vi.hoisted(() => ({
  setActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock(
  "@/app/[locale]/dashboard/admin/academic/sectionEnrollmentFeeActions",
  () => ({
    setSectionEnrollmentFeeAmountAction: setActionMock,
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const dict = {
  title: "Section enrollment fee",
  lead: "Set how much this section charges.",
  amount: "Enrollment fee amount",
  currencyAria: "Enrollment fee currency",
  currencyHelp: "Reuses the monthly plan currency.",
  noCurrency: "—",
  noActivePlanHelp: "Define the monthly fee first.",
  save: "Save enrollment fee",
  saved: "Enrollment fee updated.",
  errorSave: "Could not save the enrollment fee.",
  zeroMeans: "0 means this section does not charge an enrollment fee.",
};

const SECTION = "00000000-0000-4000-8000-000000000010";

describe("AcademicSectionEnrollmentFeeEditor", () => {
  beforeEach(() => {
    setActionMock.mockReset();
    refreshMock.mockReset();
  });

  it("renders the active plan currency next to the amount", () => {
    render(
      <AcademicSectionEnrollmentFeeEditor
        locale="en"
        sectionId={SECTION}
        initialAmount={150}
        currentPlanCurrency="USD"
        dict={dict}
      />,
    );
    expect(screen.getByLabelText(dict.amount)).toHaveValue(150);
    expect(screen.getByLabelText(dict.currencyAria)).toHaveTextContent("USD");
    expect(screen.getByText(dict.currencyHelp)).toBeInTheDocument();
  });

  it("shows the no-active-plan helper when currency is null", () => {
    render(
      <AcademicSectionEnrollmentFeeEditor
        locale="en"
        sectionId={SECTION}
        initialAmount={0}
        currentPlanCurrency={null}
        dict={dict}
      />,
    );
    expect(screen.getByLabelText(dict.currencyAria)).toHaveTextContent("—");
    expect(screen.getByText(dict.noActivePlanHelp)).toBeInTheDocument();
    expect(screen.getByText(dict.zeroMeans)).toBeInTheDocument();
  });

  it("disables the submit while pristine and enables it when the amount changes", () => {
    render(
      <AcademicSectionEnrollmentFeeEditor
        locale="en"
        sectionId={SECTION}
        initialAmount={100}
        currentPlanCurrency="USD"
        dict={dict}
      />,
    );
    const button = screen.getByRole("button", { name: dict.save });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(dict.amount), { target: { value: "200" } });
    expect(button).not.toBeDisabled();
  });

  it("submits the action and refreshes on success", async () => {
    setActionMock.mockResolvedValue({ ok: true });
    render(
      <AcademicSectionEnrollmentFeeEditor
        locale="en"
        sectionId={SECTION}
        initialAmount={0}
        currentPlanCurrency="USD"
        dict={dict}
      />,
    );
    fireEvent.change(screen.getByLabelText(dict.amount), { target: { value: "75" } });
    fireEvent.click(screen.getByRole("button", { name: dict.save }));
    await waitFor(() => {
      expect(setActionMock).toHaveBeenCalledWith({
        locale: "en",
        sectionId: SECTION,
        enrollmentFeeAmount: 75,
      });
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(await screen.findByText(dict.saved)).toBeInTheDocument();
  });

  it("shows the error message and does not refresh when the action fails", async () => {
    setActionMock.mockResolvedValue({ ok: false, code: "SAVE" });
    render(
      <AcademicSectionEnrollmentFeeEditor
        locale="en"
        sectionId={SECTION}
        initialAmount={0}
        currentPlanCurrency="USD"
        dict={dict}
      />,
    );
    fireEvent.change(screen.getByLabelText(dict.amount), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: dict.save }));
    await waitFor(() => {
      expect(setActionMock).toHaveBeenCalled();
    });
    expect(await screen.findByText(dict.errorSave)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
