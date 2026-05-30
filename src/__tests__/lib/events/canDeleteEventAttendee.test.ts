import { describe, expect, it } from "vitest";
import { canDeleteEventAttendee } from "@/lib/events/canDeleteEventAttendee";

describe("canDeleteEventAttendee", () => {
  it("allows delete when there is no payment", () => {
    expect(canDeleteEventAttendee(null)).toBe(true);
  });

  it("allows delete for pending or rejected bank transfer payments", () => {
    expect(
      canDeleteEventAttendee({
        status: "pending",
        amount: 1000,
        currency: "CLP",
        gatewayProvider: null,
      }),
    ).toBe(true);
    expect(
      canDeleteEventAttendee({
        status: "rejected",
        amount: 1000,
        currency: "CLP",
        gatewayProvider: null,
      }),
    ).toBe(true);
  });

  it("blocks delete for approved or gateway payments", () => {
    expect(
      canDeleteEventAttendee({
        status: "approved",
        amount: 1000,
        currency: "CLP",
        gatewayProvider: null,
      }),
    ).toBe(false);
    expect(
      canDeleteEventAttendee({
        status: "pending",
        amount: 1000,
        currency: "CLP",
        gatewayProvider: "flow",
      }),
    ).toBe(false);
  });
});
