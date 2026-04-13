import { describe, it, expect, vi } from "vitest";
import { loadCurrentCohort } from "@/lib/academics/currentCohort";

function mockSupabase(data: unknown, error: unknown = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data, error }),
        }),
      }),
    }),
  } as unknown as Parameters<typeof loadCurrentCohort>[0];
}

describe("loadCurrentCohort", () => {
  it("returns cohort when is_current = true row exists", async () => {
    const cohort = {
      id: "c1",
      name: "2026",
      slug: "2026",
      starts_on: "2026-03-01",
      ends_on: "2026-11-30",
    };
    const result = await loadCurrentCohort(mockSupabase(cohort));
    expect(result).toEqual(cohort);
  });

  it("returns null when no current cohort", async () => {
    const result = await loadCurrentCohort(mockSupabase(null));
    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    const result = await loadCurrentCohort(
      mockSupabase(null, { message: "fail" }),
    );
    expect(result).toBeNull();
  });
});
