// REGRESSION CHECK: matrícula amount, source cohort, and student copy stay hidden until each switch is on.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicNewCohortModal } from "@/components/organisms/AcademicNewCohortModal";

const createAcademicCohortAction = vi.fn();

vi.mock("@/app/[locale]/dashboard/admin/academics/actions", () => ({
  createAcademicCohortAction: (...args: unknown[]) => createAcademicCohortAction(...args),
}));

vi.mock("@/lib/admin-tutorials/client/adminTourSession", () => ({
  useAdminTourSessionActive: () => false,
}));

const dict = {
  title: "New cohort",
  nameLabel: "Name",
  chargesEnrollmentLabel: "Charges matrícula",
  enrollmentAmountLabel: "Amount",
  chargesMonthlyLabel: "Unified section fee",
  monthlyAmountLabel: "Monthly fee",
  copySectionsLabel: "Copy sections",
  sourceLabel: "Model cohort",
  sourcePlaceholder: "Choose",
  copyStudentsLabel: "Copy students",
  copyStudentsHint: "They stay in the source cohort.",
  submit: "Create",
  cancel: "Cancel",
  openCohort: "Open the new cohort",
  errors: {
    copy_failed: "Sections were not copied. Code: copy_failed",
    mystery: "",
  },
};

const sources = [{ id: "c-1", name: "2026" }];

function renderModal() {
  return render(
    <AcademicNewCohortModal
      locale="es"
      open
      onOpenChange={vi.fn()}
      sourceCohorts={sources}
      dict={dict}
    />,
  );
}

describe("AcademicNewCohortModal", () => {
  it("shows amount, source, and students only after each choice", async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.queryByLabelText("Amount")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Monthly fee")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Model cohort")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Copy students")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Charges matrícula"));
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
    expect(screen.queryByLabelText("Monthly fee")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Unified section fee"));
    expect(screen.getByLabelText("Monthly fee")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Copy sections"));
    expect(screen.getByLabelText("Model cohort")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy students")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Model cohort"), "c-1");
    expect(screen.getByLabelText("Copy students")).toBeInTheDocument();
  });

  it("sends the copy choices and offers the new cohort when copy fails", async () => {
    const user = userEvent.setup();
    createAcademicCohortAction.mockResolvedValue({
      ok: false,
      code: "copy_failed",
      cohortId: "new-1",
    });
    renderModal();

    await user.type(screen.getByLabelText("Name"), "2027");
    await user.click(screen.getByLabelText("Copy sections"));
    await user.selectOptions(screen.getByLabelText("Model cohort"), "c-1");
    await user.click(screen.getByLabelText("Copy students"));
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createAcademicCohortAction).toHaveBeenCalledWith({
      locale: "es",
      name: "2027",
      chargesEnrollmentFee: false,
      enrollmentFeeAmount: "",
      chargesMonthlyFee: false,
      monthlyFeeAmount: "",
      copySections: true,
      sourceCohortId: "c-1",
      copyStudents: true,
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Code: copy_failed");
    expect(screen.getByRole("button", { name: "Open the new cohort" })).toBeInTheDocument();
  });

  it("shows an unknown code as itself", async () => {
    const user = userEvent.setup();
    createAcademicCohortAction.mockResolvedValue({ ok: false, code: "not_mapped" });
    renderModal();
    await user.type(screen.getByLabelText("Name"), "2027");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("not_mapped");
  });
});
