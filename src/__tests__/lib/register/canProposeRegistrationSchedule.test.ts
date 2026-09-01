/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { canProposeRegistrationSchedule } from "@/lib/register/canProposeRegistrationSchedule";

describe("canProposeRegistrationSchedule", () => {
  it("is true only for an actionable full request with another open seat", () => {
    expect(
      canProposeRegistrationSchedule({
        status: "new",
        intakeState: "section_full",
        requestedSectionFull: true,
        preferredSectionId: "sec-full",
        openAlternativeCount: 1,
      }),
    ).toBe(true);
    expect(
      canProposeRegistrationSchedule({
        status: "new",
        intakeState: "offer_pending",
        requestedSectionFull: true,
        preferredSectionId: "sec-full",
        openAlternativeCount: 2,
      }),
    ).toBe(true);
  });

  it("is false when enrolled, no alternative, or the request is not full", () => {
    expect(
      canProposeRegistrationSchedule({
        status: "enrolled",
        intakeState: "section_full",
        openAlternativeCount: 1,
      }),
    ).toBe(false);
    expect(
      canProposeRegistrationSchedule({
        status: "new",
        intakeState: "awaiting_fee",
        requestedSectionFull: false,
        openAlternativeCount: 1,
      }),
    ).toBe(false);
    expect(
      canProposeRegistrationSchedule({
        status: "new",
        intakeState: "section_full",
        openAlternativeCount: 0,
      }),
    ).toBe(false);
  });
});
