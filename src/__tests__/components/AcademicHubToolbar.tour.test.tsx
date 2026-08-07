// REGRESSION CHECK: Tour open-modal event must open AcademicNewCohortModal without a click.
import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { AcademicHubToolbar } from "@/components/organisms/AcademicHubToolbar";
import { ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT } from "@/lib/admin-tutorials/selectors";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/es/dashboard/admin/academic",
}));

vi.mock("@/app/[locale]/dashboard/admin/academics/actions", () => ({
  createAcademicCohortAction: vi.fn(),
}));

const dict = {
  newCohort: "New cohort",
  newCohortTip: "tip",
  newCohortModal: {
    title: "Create cohort",
    nameLabel: "Name",
    slugLabel: "Slug",
    slugHint: "hint",
    submit: "Create",
    cancel: "Cancel",
    error: "Error",
  },
};

describe("AcademicHubToolbar tour anchors", () => {
  it("exposes new-cohort data-tour and opens modal on tutorial event", async () => {
    render(<AcademicHubToolbar locale="es" dict={dict} />);
    expect(document.querySelector('[data-tour="academic-new-cohort"]')).toBeTruthy();

    await act(async () => {
      window.dispatchEvent(new CustomEvent(ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT));
    });
    await waitFor(() => {
      expect(screen.getByLabelText(dict.newCohortModal.nameLabel)).toBeInTheDocument();
    });
    expect(document.querySelector('[data-tour="academic-new-cohort-name"]')).toBeTruthy();
  });
});
