// REGRESSION CHECK: Admin must resolve cohort_id for a section like teachers, so rubric saves work from admin academic links.
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { teacherSectionCohortId } from "@/lib/academics/teacherAssessmentGradeActionsSupport";

vi.mock("@/lib/academics/userIsSectionTeacherOrAssistant", () => ({
  userIsSectionTeacherOrAssistant: vi.fn(),
}));

vi.mock("@/lib/auth/resolveIsAdminSession", () => ({
  resolveIsAdminSession: vi.fn(),
}));

import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";

const userIsSectionTeacherOrAssistantMock = vi.mocked(userIsSectionTeacherOrAssistant);
const resolveIsAdminSessionMock = vi.mocked(resolveIsAdminSession);

function mockSupabase(cohortId: string | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: cohortId ? { cohort_id: cohortId } : null, error: null });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    }),
  });
  return { from } as unknown as SupabaseClient;
}

describe("teacherSectionCohortId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cohort when user is section teacher or assistant", async () => {
    userIsSectionTeacherOrAssistantMock.mockResolvedValue(true);
    const supabase = mockSupabase("cohort-a");
    await expect(teacherSectionCohortId(supabase, "user-1", "sec-1")).resolves.toBe("cohort-a");
    expect(resolveIsAdminSessionMock).not.toHaveBeenCalled();
  });

  it("returns cohort for admin when not staff on section", async () => {
    userIsSectionTeacherOrAssistantMock.mockResolvedValue(false);
    resolveIsAdminSessionMock.mockResolvedValue(true);
    const supabase = mockSupabase("cohort-b");
    await expect(teacherSectionCohortId(supabase, "admin-1", "sec-2")).resolves.toBe("cohort-b");
    expect(resolveIsAdminSessionMock).toHaveBeenCalledWith(supabase, "admin-1");
  });

  it("returns null when section missing", async () => {
    userIsSectionTeacherOrAssistantMock.mockResolvedValue(false);
    resolveIsAdminSessionMock.mockResolvedValue(true);
    const supabase = mockSupabase(null);
    await expect(teacherSectionCohortId(supabase, "admin-1", "missing")).resolves.toBeNull();
  });

  it("returns null when neither staff nor admin", async () => {
    userIsSectionTeacherOrAssistantMock.mockResolvedValue(false);
    resolveIsAdminSessionMock.mockResolvedValue(false);
    const supabase = mockSupabase("cohort-c");
    await expect(teacherSectionCohortId(supabase, "stranger", "sec-3")).resolves.toBeNull();
  });
});
