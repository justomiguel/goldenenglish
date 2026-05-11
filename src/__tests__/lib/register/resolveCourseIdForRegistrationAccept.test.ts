import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCourseIdForRegistrationAccept } from "@/lib/register/resolveCourseIdForRegistrationAccept";

const resolveCourseIdFromLevelInterestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/import/bulkImportEnrollment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/import/bulkImportEnrollment")>();
  return {
    ...actual,
    resolveCourseIdFromLevelInterest: (
      ...args: Parameters<typeof actual.resolveCourseIdFromLevelInterest>
    ) => resolveCourseIdFromLevelInterestMock(...args),
  };
});

function makeAdmin(maybeSingleImpl: () => Promise<{ data: unknown; error: unknown }>) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleImpl,
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("resolveCourseIdForRegistrationAccept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCourseIdFromLevelInterestMock.mockResolvedValue("course-fallback");
  });

  it("delegates to level-interest resolver when section id is missing", async () => {
    const admin = makeAdmin(async () => ({ data: null, error: null }));
    const id = await resolveCourseIdForRegistrationAccept(admin, {
      preferredSectionId: null,
      levelInterestFallback: "A1",
    });
    expect(id).toBe("course-fallback");
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenCalledWith(admin, "A1");
  });

  it("ignores blank preferred section id", async () => {
    const admin = makeAdmin(async () => ({ data: null, error: null }));
    await resolveCourseIdForRegistrationAccept(admin, {
      preferredSectionId: "   ",
      levelInterestFallback: "B1",
    });
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenCalledWith(admin, "B1");
  });

  it("falls back when section row is empty", async () => {
    const admin = makeAdmin(async () => ({ data: null, error: null }));
    await resolveCourseIdForRegistrationAccept(admin, {
      preferredSectionId: "sec-1",
      levelInterestFallback: "A2",
    });
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenCalledWith(admin, "A2");
  });

  it("falls back when section query errors", async () => {
    const admin = makeAdmin(async () => ({ data: null, error: { message: "x" } }));
    await resolveCourseIdForRegistrationAccept(admin, {
      preferredSectionId: "sec-1",
      levelInterestFallback: "A2",
    });
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenCalledWith(admin, "A2");
  });

  it("resolves from section name when it is a CEFR level", async () => {
    resolveCourseIdFromLevelInterestMock.mockResolvedValueOnce("course-a1");
    const admin = makeAdmin(async () => ({
      data: { name: "A1", academic_cohorts: null },
      error: null,
    }));
    const id = await resolveCourseIdForRegistrationAccept(admin, {
      preferredSectionId: "sec-1",
      levelInterestFallback: "B2",
    });
    expect(id).toBe("course-a1");
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenCalledWith(admin, "A1");
  });

  it("tries cohort+section then section when resolving CEFR", async () => {
    resolveCourseIdFromLevelInterestMock.mockResolvedValueOnce("course-b1");
    const admin = makeAdmin(async () => ({
      data: {
        name: "B1",
        academic_cohorts: [{ name: "Extra" }],
      },
      error: null,
    }));
    const id = await resolveCourseIdForRegistrationAccept(admin, {
      preferredSectionId: "sec-1",
      levelInterestFallback: "C1",
    });
    expect(id).toBe("course-b1");
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenCalledTimes(1);
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenCalledWith(admin, "B1");
  });

  it("uses cohort object shape when building combined candidate", async () => {
    resolveCourseIdFromLevelInterestMock.mockResolvedValueOnce("course-b2");
    const admin = makeAdmin(async () => ({
      data: {
        name: "B2",
        academic_cohorts: { name: "Pre" },
      },
      error: null,
    }));
    const id = await resolveCourseIdForRegistrationAccept(admin, {
      preferredSectionId: "sec-1",
      levelInterestFallback: "C2",
    });
    expect(id).toBe("course-b2");
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenCalledWith(admin, "B2");
  });

  it("matches CEFR from cohort-only candidate after section misses", async () => {
    resolveCourseIdFromLevelInterestMock.mockResolvedValueOnce("course-c1");
    const admin = makeAdmin(async () => ({
      data: {
        name: "Workshop",
        academic_cohorts: [{ name: "C1" }],
      },
      error: null,
    }));
    const id = await resolveCourseIdForRegistrationAccept(admin, {
      preferredSectionId: "sec-1",
      levelInterestFallback: "B1",
    });
    expect(id).toBe("course-c1");
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenCalledWith(admin, "C1");
  });

  it("falls through to fallback when section row has no CEFR in candidates", async () => {
    const admin = makeAdmin(async () => ({
      data: {
        name: "Workshop",
        academic_cohorts: [{ name: "Arts" }],
      },
      error: null,
    }));
    await resolveCourseIdForRegistrationAccept(admin, {
      preferredSectionId: "sec-1",
      levelInterestFallback: "B1",
    });
    expect(resolveCourseIdFromLevelInterestMock).toHaveBeenLastCalledWith(admin, "B1");
  });
});
