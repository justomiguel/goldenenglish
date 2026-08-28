/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { registrationInboxPrimaryKind } from "@/lib/register/registrationInboxPrimaryKind";

describe("registrationInboxPrimaryKind", () => {
  it("keeps Accept only for none with no fee", () => {
    expect(
      registrationInboxPrimaryKind({ status: "new", intakeState: "none", snapshotTotal: 0 }),
    ).toBe("accept");
  });

  it("offers waive for waiting payment, including corrupt none+total", () => {
    expect(
      registrationInboxPrimaryKind({
        status: "new",
        intakeState: "awaiting_fee",
        snapshotTotal: 80,
      }),
    ).toBe("waive");
    expect(
      registrationInboxPrimaryKind({ status: "new", intakeState: "none", snapshotTotal: 80 }),
    ).toBe("waive");
  });

  it("routes receipt and assign states", () => {
    expect(
      registrationInboxPrimaryKind({
        status: "new",
        intakeState: "receipt_pending",
        snapshotTotal: 80,
      }),
    ).toBe("receipt");
    expect(
      registrationInboxPrimaryKind({
        status: "new",
        intakeState: "needs_section",
        snapshotTotal: 0,
      }),
    ).toBe("assign");
  });
});
