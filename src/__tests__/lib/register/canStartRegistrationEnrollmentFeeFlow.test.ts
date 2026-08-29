/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { canStartRegistrationEnrollmentFeeFlow } from "@/lib/register/canStartRegistrationEnrollmentFeeFlow";

const SEC = "11111111-1111-4111-8111-111111111111";

function row(
  overrides: Partial<Parameters<typeof canStartRegistrationEnrollmentFeeFlow>[0]> = {},
) {
  return {
    status: "new",
    preferred_section_id: SEC,
    additionalSectionIds: [],
    requestedSectionFull: false,
    feeCaptured: false,
    chargesEnrollmentFee: true,
    snapshotTotal: 80,
    intakeState: "none" as const,
    ...overrides,
  };
}

describe("canStartRegistrationEnrollmentFeeFlow", () => {
  it("is true for an actionable lead with a matrícula to collect and open seats", () => {
    expect(canStartRegistrationEnrollmentFeeFlow(row())).toBe(true);
    expect(canStartRegistrationEnrollmentFeeFlow(row({ status: "contacted" }))).toBe(true);
  });

  it("is false when no matrícula is due so the admin just accepts", () => {
    expect(
      canStartRegistrationEnrollmentFeeFlow(
        row({ chargesEnrollmentFee: false, snapshotTotal: 0 }),
      ),
    ).toBe(false);
  });

  it("is true from a leftover snapshot or a live section fee", () => {
    expect(
      canStartRegistrationEnrollmentFeeFlow(
        row({ chargesEnrollmentFee: false, snapshotTotal: 80 }),
      ),
    ).toBe(true);
    expect(
      canStartRegistrationEnrollmentFeeFlow(
        row({ chargesEnrollmentFee: true, snapshotTotal: 0 }),
      ),
    ).toBe(true);
  });

  it("is false when a requested section is full so the admin must relocate first", () => {
    expect(canStartRegistrationEnrollmentFeeFlow(row({ requestedSectionFull: true }))).toBe(
      false,
    );
  });

  it("is false without a requested section, after capture, or once the pay flow started", () => {
    expect(
      canStartRegistrationEnrollmentFeeFlow(row({ preferred_section_id: null })),
    ).toBe(false);
    expect(canStartRegistrationEnrollmentFeeFlow(row({ feeCaptured: true }))).toBe(false);
    expect(
      canStartRegistrationEnrollmentFeeFlow(row({ intakeState: "awaiting_fee" })),
    ).toBe(false);
    expect(
      canStartRegistrationEnrollmentFeeFlow(row({ intakeState: "section_full" })),
    ).toBe(false);
    expect(canStartRegistrationEnrollmentFeeFlow(row({ status: "enrolled" }))).toBe(false);
  });
});
