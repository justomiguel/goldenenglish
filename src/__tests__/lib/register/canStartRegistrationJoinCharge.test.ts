/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { canStartRegistrationJoinCharge } from "@/lib/register/canStartRegistrationJoinCharge";

describe("canStartRegistrationJoinCharge", () => {
  it("is true for an open trial lead so the admin can send the join-pay link", () => {
    expect(canStartRegistrationJoinCharge({ intent: "trial", status: "new" })).toBe(true);
    expect(canStartRegistrationJoinCharge({ intent: "trial", status: "contacted" })).toBe(
      true,
    );
  });

  it("is false for a pre-enrollment or a lead that is already enrolled", () => {
    expect(canStartRegistrationJoinCharge({ intent: "reserve", status: "new" })).toBe(false);
    expect(canStartRegistrationJoinCharge({ status: "new" })).toBe(false);
    expect(canStartRegistrationJoinCharge({ intent: "trial", status: "enrolled" })).toBe(
      false,
    );
  });
});
