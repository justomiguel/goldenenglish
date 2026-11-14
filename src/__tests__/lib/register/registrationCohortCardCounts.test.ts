/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { registrationCohortCardCounts } from "@/lib/register/registrationCohortCardCounts";

describe("registrationCohortCardCounts", () => {
  it("counts pending, contacted, and enrolled leads in one cohort set", () => {
    expect(
      registrationCohortCardCounts([
        { status: "new" },
        { status: "new" },
        { status: "contacted" },
        { status: "enrolled" },
        { status: "enrolled" },
      ]),
    ).toEqual({ total: 5, pending: 2, contacted: 1, enrolled: 2 });
  });

  it("keeps a lead with another status in the total only", () => {
    expect(registrationCohortCardCounts([{ status: "withdrawn" }])).toEqual({
      total: 1,
      pending: 0,
      contacted: 0,
      enrolled: 0,
    });
  });
});
