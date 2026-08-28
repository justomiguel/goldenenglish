/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { registrationPayPageKind } from "@/lib/register/registrationPayPageKind";

const base = {
  status: "new",
  intakeState: "awaiting_fee",
  feeCaptured: false,
  snapshotTotal: 80,
  sectionIsFull: false,
};

describe("registrationPayPageKind", () => {
  it("returns enrolled when the lead is already enrolled", () => {
    expect(registrationPayPageKind({ ...base, status: "enrolled" })).toBe("enrolled");
  });

  it("returns needs_section when they paid or waived without a schedule", () => {
    expect(
      registrationPayPageKind({ ...base, intakeState: "needs_section", feeCaptured: true }),
    ).toBe("needs_section");
  });

  it("returns section_full when a requested seat is gone and nothing was captured", () => {
    expect(registrationPayPageKind({ ...base, sectionIsFull: true })).toBe("section_full");
  });

  it("returns captured_full when the fee was captured but the seat vanished", () => {
    expect(
      registrationPayPageKind({
        ...base,
        feeCaptured: true,
        sectionIsFull: true,
        intakeState: "section_full",
      }),
    ).toBe("captured_full");
  });

  it("returns receipt_pending while a transfer is in review", () => {
    expect(registrationPayPageKind({ ...base, intakeState: "receipt_pending" })).toBe(
      "receipt_pending",
    );
  });

  it("returns captured when the gateway already took the money and the seat is still open", () => {
    expect(registrationPayPageKind({ ...base, feeCaptured: true })).toBe("captured");
  });

  it("returns no_fee when the snapshot total is zero", () => {
    expect(registrationPayPageKind({ ...base, snapshotTotal: 0, intakeState: "none" })).toBe(
      "no_fee",
    );
  });

  it("returns pay when matrícula is due and the seat is open", () => {
    expect(registrationPayPageKind(base)).toBe("pay");
  });
});
