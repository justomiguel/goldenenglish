// REGRESSION CHECK: a known copy code shows its sentence. An unknown code stays visible.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicCopySectionsModal } from "@/components/organisms/AcademicCopySectionsModal";

const copyCohortSectionStructureAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/es/dashboard/admin/academic",
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/copyCohortSectionsActions", () => ({
  copyCohortSectionStructureAction: (...args: unknown[]) => copyCohortSectionStructureAction(...args),
}));

const dict = {
  title: "Copy",
  lead: "Students stay in the source cohort.",
  sourceLabel: "From",
  sourcePlaceholder: "Choose",
  includeStudentsLabel: "Copy students",
  includeStudentsHint: "They stay enrolled in the source section.",
  submit: "Copy structure",
  cancel: "Cancel",
  errors: {
    EMPTY_SOURCE: "That cohort has no sections. Code: EMPTY_SOURCE",
    SAVE: "The sections were not copied. Code: SAVE",
  },
};

describe("AcademicCopySectionsModal", () => {
  it("shows the empty-source sentence and the raw code when unknown", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AcademicCopySectionsModal
        locale="es"
        targetCohortId="tgt"
        open
        onOpenChange={vi.fn()}
        sourceCohortOptions={[{ id: "src", label: "2026" }]}
        dict={dict}
      />,
    );

    copyCohortSectionStructureAction.mockResolvedValue({ ok: false, code: "EMPTY_SOURCE" });
    await user.selectOptions(screen.getByLabelText("From"), "src");
    await user.click(screen.getByRole("button", { name: "Copy structure" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Code: EMPTY_SOURCE");
    expect(screen.queryByText(dict.errors.SAVE)).not.toBeInTheDocument();

    copyCohortSectionStructureAction.mockResolvedValue({ ok: false, code: "not_mapped" });
    rerender(
      <AcademicCopySectionsModal
        locale="es"
        targetCohortId="tgt"
        open
        onOpenChange={vi.fn()}
        sourceCohortOptions={[{ id: "src", label: "2026" }]}
        dict={dict}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Copy structure" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("not_mapped");
  });
});
