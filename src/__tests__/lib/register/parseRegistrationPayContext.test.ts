/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { parseRegistrationPayContext } from "@/lib/register/parseRegistrationPayContext";

describe("parseRegistrationPayContext", () => {
  it("reads the first RPC row", () => {
    const ctx = parseRegistrationPayContext([
      {
        first_name: "Ana",
        last_name: "Pérez",
        status: "new",
        intake_state: "awaiting_fee",
        fee_captured: false,
        fee_snapshot: { total: 80, currency: "CLP" },
        preferred_section_id: "sec-1",
        additional_section_ids: ["sec-2"],
      },
    ]);
    expect(ctx).toEqual({
      firstName: "Ana",
      lastName: "Pérez",
      status: "new",
      intakeState: "awaiting_fee",
      feeCaptured: false,
      snapshotTotal: 80,
      snapshotCurrency: "CLP",
      feeSnapshot: { total: 80, currency: "CLP" },
      preferredSectionId: "sec-1",
      proposedSectionId: null,
      additionalSectionIds: ["sec-2"],
    });
  });

  it("returns null for an unknown token", () => {
    expect(parseRegistrationPayContext([])).toBeNull();
    expect(parseRegistrationPayContext(null)).toBeNull();
  });

  it("reads proposed_section_id from the RPC row", () => {
    const ctx = parseRegistrationPayContext([
      {
        first_name: "Ana",
        last_name: "Pérez",
        status: "new",
        intake_state: "offer_pending",
        fee_captured: false,
        fee_snapshot: { total: 80, currency: "CLP" },
        preferred_section_id: "sec-full",
        additional_section_ids: [],
        proposed_section_id: "sec-open",
      },
    ]);
    expect(ctx?.proposedSectionId).toBe("sec-open");
    expect(ctx?.preferredSectionId).toBe("sec-full");
    expect(ctx?.intakeState).toBe("offer_pending");
  });
});
