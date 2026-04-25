import { describe, expect, it, vi } from "vitest";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";

const { revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

// REGRESSION CHECK: section/enrollment/fee-plan changes feed Finance cohort
// matrices, so academic mutations must invalidate the Finance hub too.
describe("revalidateAcademicSurfaces", () => {
  it("invalidates academic, teacher and finance surfaces", () => {
    revalidateAcademicSurfaces("es");

    expect(revalidatePath).toHaveBeenCalledWith(
      "/es/dashboard/admin/academic",
      "layout",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/admin/finance", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/teacher/sections");
  });
});
