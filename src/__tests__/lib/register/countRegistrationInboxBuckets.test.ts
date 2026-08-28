/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { countRegistrationInboxBuckets } from "@/lib/register/countRegistrationInboxBuckets";

describe("countRegistrationInboxBuckets", () => {
  it("splits urgent from waiting payment and ignores enrolled", () => {
    expect(
      countRegistrationInboxBuckets([
        { status: "new", intakeState: "none", snapshotTotal: 0 },
        { status: "new", intakeState: "receipt_pending", snapshotTotal: 80 },
        { status: "new", intakeState: "awaiting_fee", snapshotTotal: 80 },
        { status: "new", intakeState: "none", snapshotTotal: 80 },
        { status: "enrolled", intakeState: "none", snapshotTotal: 0 },
      ]),
    ).toEqual({ urgentCount: 2, awaitingFeeCount: 2 });
  });
});
