/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  countRegistrationInboxFilters,
  mapInboxLeadFields,
} from "@/lib/register/countRegistrationInboxFilters";

describe("countRegistrationInboxFilters", () => {
  it("counts trial leads separately", () => {
    const counts = countRegistrationInboxFilters([
      { status: "new", intake_state: "none", fee_snapshot: { total: 0 }, intent: "trial" },
      { status: "new", intake_state: "none", fee_snapshot: { total: 0 }, intent: "reserve" },
    ]);
    expect(counts.trial).toBe(1);
    expect(counts.urgent).toBe(2);
  });

  it("counts each intake bucket and maps receipt fields", () => {
    const counts = countRegistrationInboxFilters([
      { status: "new", intake_state: "awaiting_fee", fee_snapshot: { total: 10 } },
      { status: "new", intake_state: "receipt_pending" },
      { status: "new", intake_state: "needs_section" },
      { status: "new", intake_state: "section_full" },
      { status: "contacted", intake_state: "none" },
    ]);
    expect(counts).toMatchObject({
      awaiting_fee: 1,
      receipt_pending: 1,
      needs_section: 1,
      section_full: 1,
      contacted: 1,
    });
    expect(mapInboxLeadFields({ fee_captured: true, enrollment_fee_receipt_path: " /r.pdf " })).toEqual(
      expect.objectContaining({
        feeCaptured: true,
        enrollmentFeeReceiptPath: " /r.pdf ",
      }),
    );
    expect(mapInboxLeadFields({ enrollment_fee_receipt_path: "   " }).enrollmentFeeReceiptPath).toBeNull();
  });
});
