/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { formatRegistrationIntakeLabel } from "@/lib/register/formatRegistrationIntakeLabel";

const labels = {
  awaitingFee: "Enrollment fee pending {{amount}}",
  receiptPending: "Receipt in review",
  needsSection: "Needs a section",
  sectionFull: "Section full",
  offerPending: "Waiting for a reply — we offered {{section}}",
};

describe("formatRegistrationIntakeLabel", () => {
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
