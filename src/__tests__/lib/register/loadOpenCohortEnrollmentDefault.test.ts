/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { loadOpenCohortEnrollmentDefault } from "@/lib/register/loadOpenCohortEnrollmentDefault";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerError: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

const COHORT = "9c97bc3f-1592-4735-9947-ce243e65333b";

function admin(amount: number | null) {
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

describe("loadOpenCohortEnrollmentDefault", () => {
  it("returns the open cohort matrícula", async () => {
    const fee = await loadOpenCohortEnrollmentDefault(admin(55000) as never);
    expect(fee).toEqual({ id: COHORT, name: "2027", amount: 55000 });
  });

  it("returns null when the open cohort does not charge", async () => {
    const fee = await loadOpenCohortEnrollmentDefault(admin(0) as never);
    expect(fee).toBeNull();
  });
});
