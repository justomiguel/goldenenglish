/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { formatRegistrationIntakeLabel } from "@/lib/register/formatRegistrationIntakeLabel";

const labels = {
  awaitingFee: "Waiting for payment: {{breakdown}} {{amount}}",
  receiptPending: "Join-package receipt in review",
  needsSection: "Assign a schedule to send the charge",
  sectionFull: "Section full — assign another schedule",
  offerPending: "Waiting for a reply — we offered {{section}}",
  readyToEnrol: "Ready to enrol",
  enrollmentKind: "Enrollment fee",
};

describe("formatRegistrationIntakeLabel", () => {
  it("tells the admin to assign a schedule when there is no checkout", () => {
    expect(
      formatRegistrationIntakeLabel({
        intakeState: "needs_section",
        locale: "en",
        labels,
      }),
    ).toBe("Assign a schedule to send the charge");
  });

  it("names the package while waiting for payment", () => {
    expect(
      formatRegistrationIntakeLabel({
        intakeState: "awaiting_fee",
        snapshotTotal: 120000,
        snapshotCurrency: "CLP",
        feeSnapshot: {
          kind: "join_package",
          enrollment: { lines: [{ sectionId: "s1", sectionName: "A2", amount: 80000 }] },
          tuition: [{ sectionId: "s1", sectionName: "A2", year: 2026, month: 8, amount: 40000 }],
        },
        locale: "en",
        labels,
      }),
    ).toMatch(/Waiting for payment: Enrollment fee \+ August/i);
  });

  it("names the proposed schedule even when the original request is still full", () => {
    expect(
      formatRegistrationIntakeLabel({
        intakeState: "offer_pending",
        requestedSectionFull: true,
        proposedSectionName: "B1 Tarde",
        locale: "en",
        labels,
      }),
    ).toBe("Waiting for a reply — we offered B1 Tarde");
  });
});
