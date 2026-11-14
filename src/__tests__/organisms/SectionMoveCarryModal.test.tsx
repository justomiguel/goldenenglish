import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionMoveCarryModal } from "@/components/organisms/SectionMoveCarryModal";
import { dictEn } from "@/test/dictEn";
import type { SectionMoveCarryFacts } from "@/lib/academics/loadSectionMoveCarryFacts";

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => "web-desktop",
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard/admin/academic",
  useRouter: () => ({ refresh: vi.fn() }),
}));

const copy = dictEn.dashboard.academicSectionPage.moveCarry;
const errors = dictEn.dashboard.academics.errors;
const empty: SectionMoveCarryFacts = {
  originPayments: [],
  destinationPayments: [],
  originScholarships: [],
  destinationScholarships: [],
};
const collision: SectionMoveCarryFacts = {
  originPayments: [{ id: "723e4567-e89b-12d3-a456-426614174010", month: 3, year: 2026 }],
  destinationPayments: [{ id: "723e4567-e89b-12d3-a456-426614174011", month: 3, year: 2026 }],
  originScholarships: [],
  destinationScholarships: [],
};

function renderModal(facts: SectionMoveCarryFacts, onConfirm = vi.fn()) {
  render(
    <SectionMoveCarryModal
      open
      locale="en"
      copy={copy}
      missingChoice={errors.carry_choice_missing}
      unknownError={errors.unknownError}
      facts={facts}
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  return onConfirm;
}

describe("SectionMoveCarryModal", () => {
  it("starts with finance checked and attendance and grades clear", async () => {
    const user = userEvent.setup();
    const onConfirm = renderModal(empty);
    expect(screen.getByRole("checkbox", { name: copy.payments })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: copy.scholarships })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: copy.enrollmentFee })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: copy.annualSettlement })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: copy.attendance })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: copy.grades })).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: copy.confirm }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ payments: true, attendance: false, grades: false }),
      [],
    );
  });

  it("asks for Leave or Replace before it confirms a colliding month", async () => {
    const user = userEvent.setup();
    const onConfirm = renderModal(collision);
    await user.click(screen.getByRole("button", { name: copy.confirm }));
    expect(await screen.findByRole("alert")).toHaveTextContent("carry_choice_missing");
    expect(screen.getByRole("alert")).toHaveTextContent("March 2026");
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("radio", { name: copy.replace }));
    await user.click(screen.getByRole("button", { name: copy.confirm }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ payments: true }),
      [{ originId: collision.originPayments[0].id, choice: "replace" }],
    );
  });
});
