import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicCohortCurrentToggle } from "@/components/molecules/AcademicCohortCurrentToggle";
import { setCurrentCohortAction } from "@/app/[locale]/dashboard/admin/academic/cohortActions";

const routerMock = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/cohortActions", () => ({
  setCurrentCohortAction: vi.fn(),
}));

describe("AcademicCohortCurrentToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes the page after setting the current cohort", async () => {
    vi.mocked(setCurrentCohortAction).mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(
      <AcademicCohortCurrentToggle
        cohortId="cohort-1"
        locale="en"
        label="Set as current"
        showIcon
      />,
    );

    await user.click(screen.getByRole("button", { name: "Set as current" }));

    await waitFor(() => {
      expect(setCurrentCohortAction).toHaveBeenCalledWith({ cohortId: "cohort-1", locale: "en" });
      expect(routerMock.refresh).toHaveBeenCalled();
    });
  });
});
