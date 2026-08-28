/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  intakeStateForSnapshotTotal,
  isRegistrationAwaitingFee,
  isRegistrationStaffUrgent,
} from "@/lib/register/registrationIntake";

describe("intakeStateForSnapshotTotal", () => {
  it("is awaiting_fee when there is an amount due", () => {
    expect(intakeStateForSnapshotTotal(80)).toBe("awaiting_fee");
  });

  it("is none when the total is 0", () => {
    expect(intakeStateForSnapshotTotal(0)).toBe("none");
  });
});

describe("isRegistrationStaffUrgent", () => {
  it("ignores enrolled leads", () => {
    expect(
      isRegistrationStaffUrgent({
        status: "enrolled",
        intakeState: "receipt_pending",
        snapshotTotal: 80,
      }),
    ).toBe(false);
  });

  it("counts receipt, needs_section, section_full, and none with no fee", () => {
    expect(
      isRegistrationStaffUrgent({
        status: "new",
        intakeState: "receipt_pending",
        snapshotTotal: 80,
      }),
    ).toBe(true);
    expect(
      isRegistrationStaffUrgent({
        status: "new",
        intakeState: "needs_section",
        snapshotTotal: 80,
      }),
    ).toBe(true);
    expect(
      isRegistrationStaffUrgent({
        status: "new",
        intakeState: "section_full",
        snapshotTotal: 80,
      }),
    ).toBe(true);
    expect(
      isRegistrationStaffUrgent({
        status: "new",
        intakeState: "none",
        snapshotTotal: 0,
      }),
    ).toBe(true);
  });

  it("does not count waiting payment as urgent", () => {
    expect(
      isRegistrationStaffUrgent({
        status: "new",
        intakeState: "awaiting_fee",
        snapshotTotal: 80,
      }),
    ).toBe(false);
    expect(
      isRegistrationStaffUrgent({
        status: "new",
        intakeState: "none",
        snapshotTotal: 80,
      }),
    ).toBe(false);
  });
});

describe("isRegistrationAwaitingFee", () => {
  it("counts awaiting_fee and corrupt none+total", () => {
    expect(
      isRegistrationAwaitingFee({
        status: "new",
        intakeState: "awaiting_fee",
        snapshotTotal: 80,
      }),
    ).toBe(true);
    expect(
      isRegistrationAwaitingFee({
        status: "new",
        intakeState: "none",
        snapshotTotal: 80,
      }),
    ).toBe(true);
  });

  it("ignores enrolled and zero-fee none", () => {
    expect(
      isRegistrationAwaitingFee({
        status: "enrolled",
        intakeState: "awaiting_fee",
        snapshotTotal: 80,
      }),
    ).toBe(false);
    expect(
      isRegistrationAwaitingFee({
        status: "new",
        intakeState: "none",
        snapshotTotal: 0,
      }),
    ).toBe(false);
  });
});
