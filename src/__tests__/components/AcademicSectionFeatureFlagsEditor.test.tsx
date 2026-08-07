// REGRESSION CHECK: Feature flags persist on toggle; failures revert the
// checkbox and map disable-guard codes to dictionary messages.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionFeatureFlagsEditor } from "@/components/organisms/AcademicSectionFeatureFlagsEditor";

const { updateFlags, refresh } = vi.hoisted(() => ({
  updateFlags: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionFeatureFlagActions", () => ({
  updateAcademicSectionFeatureFlagsAction: (...args: unknown[]) => updateFlags(...args),
}));

const dict = {
  title: "Learning features",
  lead: "Lead",
  evaluationsLabel: "Has evaluations",
  evaluationsHelp: "Evaluations help",
  learningRouteLabel: "Uses learning route",
  learningRouteHelp: "Route help",
  save: "Save learning features",
  saved: "Saved",
  errorSave: "Save failed",
  errorHasEvaluations: "Clear assessments first",
  errorHasLearningRoute: "Clear route first",
};

describe("AcademicSectionFeatureFlagsEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves on evaluations toggle and refreshes", async () => {
    updateFlags.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <AcademicSectionFeatureFlagsEditor
        locale="es"
        sectionId="00000000-0000-4000-8000-000000000001"
        initialRequiresEvaluationsToPass={false}
        initialUsesLearningRoute={false}
        dict={dict}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /has evaluations/i }));

    await waitFor(() => {
      expect(updateFlags).toHaveBeenCalledWith(
        expect.objectContaining({
          requiresEvaluationsToPass: true,
          usesLearningRoute: false,
        }),
      );
    });
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /save learning features/i })).not.toBeInTheDocument();
  });

  it("reverts checkbox when save fails", async () => {
    updateFlags.mockResolvedValue({ ok: false, code: "SAVE" });
    const user = userEvent.setup();
    render(
      <AcademicSectionFeatureFlagsEditor
        locale="es"
        sectionId="00000000-0000-4000-8000-000000000001"
        initialRequiresEvaluationsToPass={false}
        initialUsesLearningRoute={false}
        dict={dict}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /has evaluations/i });
    await user.click(checkbox);

    expect(await screen.findByRole("alert")).toHaveTextContent("Save failed");
    expect(checkbox).not.toBeChecked();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("renders standalone title and card chrome by default", () => {
    const { container } = render(
      <AcademicSectionFeatureFlagsEditor
        locale="es"
        sectionId="00000000-0000-4000-8000-000000000001"
        initialRequiresEvaluationsToPass={false}
        initialUsesLearningRoute={false}
        dict={dict}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: dict.title })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("border");
  });

  it("suppresses standalone title and card chrome when embedded", () => {
    const { container } = render(
      <AcademicSectionFeatureFlagsEditor
        embedded
        locale="es"
        sectionId="00000000-0000-4000-8000-000000000001"
        initialRequiresEvaluationsToPass={false}
        initialUsesLearningRoute={false}
        dict={dict}
      />,
    );

    expect(screen.queryByRole("heading", { level: 2, name: dict.title })).not.toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveClass("border");
  });

  it("shows has_evaluations guard message and reverts", async () => {
    updateFlags.mockResolvedValue({ ok: false, code: "has_evaluations" });
    const user = userEvent.setup();
    render(
      <AcademicSectionFeatureFlagsEditor
        locale="es"
        sectionId="00000000-0000-4000-8000-000000000001"
        initialRequiresEvaluationsToPass={true}
        initialUsesLearningRoute={false}
        dict={dict}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /has evaluations/i });
    expect(checkbox).toBeChecked();
    await user.click(checkbox);

    expect(await screen.findByRole("alert")).toHaveTextContent("Clear assessments first");
    expect(checkbox).toBeChecked();
    expect(refresh).not.toHaveBeenCalled();
  });
});
