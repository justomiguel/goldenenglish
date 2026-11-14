/** @vitest-environment node */
// REGRESSION CHECK: Cohort matrícula must win over a section amount and a zero snapshot, or cash payment returns no_fee for a lead with no section.
import { describe, expect, it, vi } from "vitest";
import { loadRegistrationCashMatriculaAmounts } from "@/lib/register/loadRegistrationCashMatriculaAmounts";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerError: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

const COHORT = "9c97bc3f-1592-4735-9947-ce243e65333b";

function openCohortAdmin(amount: number) {
  return {
    from: (table: string) => {
      if (table === "site_settings") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [{ value: COHORT }], error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          is: () =>
            Promise.resolve({
              data: [
                {
                  id: COHORT,
                  name: "2027",
                  is_current: true,
                  default_enrollment_fee_amount: amount,
                },
              ],
              error: null,
            }),
        }),
      };
    },
  };
}

describe("loadRegistrationCashMatriculaAmounts", () => {
  it("reads the inscriptions cohort matrícula when the lead has no section", async () => {
    const amounts = await loadRegistrationCashMatriculaAmounts(openCohortAdmin(55000) as never, null);
    expect(amounts).toEqual({ cohortAmount: 55000, sectionAmount: 0 });
  });

  it("reads the section cohort matrícula and the section amount separately", async () => {
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  enrollment_fee_amount: 50000,
                  academic_cohorts: { default_enrollment_fee_amount: 55000 },
                },
                error: null,
              }),
          }),
        }),
      }),
    };
    const amounts = await loadRegistrationCashMatriculaAmounts(admin as never, "section-1");
    expect(amounts).toEqual({ cohortAmount: 55000, sectionAmount: 50000 });
  });
});
