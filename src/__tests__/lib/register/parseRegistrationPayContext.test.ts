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
      preferredSectionId: "sec-1",
      additionalSectionIds: ["sec-2"],
    });
  });

  it("returns null for an unknown token", () => {
    expect(parseRegistrationPayContext([])).toBeNull();
    expect(parseRegistrationPayContext(null)).toBeNull();
  });
});
