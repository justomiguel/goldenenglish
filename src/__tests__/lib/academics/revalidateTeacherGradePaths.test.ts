import { describe, it, expect, vi, beforeEach } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

import { revalidateTeacherGradePaths } from "@/lib/academics/teacherAssessmentGradeActionsSupport";

describe("revalidateTeacherGradePaths", () => {
  beforeEach(() => {
    revalidatePath.mockClear();
  });

  it("revalidates parent and student progress dashboards", () => {
    revalidateTeacherGradePaths(
      {
        locale: "es",
        sectionId: "sec-1",
        assessmentId: "asm-1",
        enrollmentId: "enr-1",
        score: 85,
        rubric: {},
        teacherFeedback: null,
      },
      "cohort-1",
    );

    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/parent/progress");
    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/student/progress");
  });
});
