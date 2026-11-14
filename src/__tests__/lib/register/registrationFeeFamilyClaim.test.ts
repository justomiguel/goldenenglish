import { describe, expect, it } from "vitest";
import {
  registrationFeeFamilyClaim,
  withRegistrationFeeCashClaim,
} from "@/lib/register/registrationFeeFamilyClaim";

describe("registrationFeeFamilyClaim", () => {
  it("reads a cash claim and ignores other snapshots", () => {
    expect(registrationFeeFamilyClaim({ total: 80, familyClaim: "cash" })).toBe("cash");
    expect(registrationFeeFamilyClaim({ total: 80 })).toBeNull();
  });

  it("keeps the quote when it marks a cash claim", () => {
    expect(withRegistrationFeeCashClaim({ total: 80, currency: "ARS" })).toEqual({
      total: 80,
      currency: "ARS",
      familyClaim: "cash",
    });
  });
});
