import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionLearningRouteSelector } from "@/components/organisms/AcademicSectionLearningRouteSelector";
import { dictEn } from "@/test/dictEn";

const saveSectionLearningRouteAction = vi.fn(async () => ({ ok: true, id: "assignment-1" }));

vi.mock("@/app/[locale]/dashboard/admin/academic/contents/actions", () => ({
  saveSectionLearningRouteAction: (...args: unknown[]) => saveSectionLearningRouteAction(...args),
}));

describe("AcademicSectionLearningRouteSelector", () => {
  it("saves free-flow mode without a route id", async () => {
    const user = userEvent.setup();
    const dict = dictEn.dashboard.academicSectionPage.learningRoute;
    render(
      <AcademicSectionLearningRouteSelector
        locale="en"
        cohortId="00000000-0000-4000-8000-000000000001"
        sectionId="00000000-0000-4000-8000-000000000002"
        routes={[{ id: "00000000-0000-4000-8000-000000000003", title: "A1 route", description: "" }]}
        assignment={null}
        dict={dict}
      />,
    );

    await user.click(screen.getByRole("button", { name: dict.save }));

    await waitFor(() => {
      expect(saveSectionLearningRouteAction).toHaveBeenCalledWith(expect.objectContaining({
        mode: "free_flow",
        learningRouteId: null,
      }));
    });
  });
});
