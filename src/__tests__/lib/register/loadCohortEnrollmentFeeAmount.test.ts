/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { loadCohortEnrollmentFeeAmount } from "@/lib/register/loadCohortEnrollmentFeeAmount";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

function admin(amount: number | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { default_enrollment_fee_amount: amount },
              error: null,
            }),
        }),
      }),
    }),
  };
}

describe("loadCohortEnrollmentFeeAmount", () => {
  it("reads the selected cohort matrícula", async () => {
    const amount = await loadCohortEnrollmentFeeAmount(admin(55000) as never, "cohort-2027");
    expect(amount).toBe(55000);
  });

  it("returns 0 when the cohort has no matrícula", async () => {
    const amount = await loadCohortEnrollmentFeeAmount(admin(0) as never, "cohort-free");
    expect(amount).toBe(0);
  });
});
