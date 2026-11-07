import { describe, expect, it } from "vitest";
import { decideSeatToggle } from "@/lib/events/decideSeatToggle";

describe("decideSeatToggle", () => {
  it("does not add a seat that is not free", () => {
    const decision = decideSeatToggle({
      seatKey: "f1:b1:0:1",
      state: "held",
      selectedSeatKeys: [],
      requiredCount: 2,
    });
    expect(decision).toEqual({ action: "refuse", seatKey: "f1:b1:0:1" });
  });

  it("adds a free seat and drops the oldest when the count is full", () => {
    expect(
      decideSeatToggle({
        seatKey: "f1:b1:0:2",
        state: "free",
        selectedSeatKeys: ["f1:b1:0:0"],
        requiredCount: 1,
      }),
    ).toEqual({ action: "replace", next: ["f1:b1:0:2"] });
  });

  it("removes a selected seat without an availability check", () => {
    expect(
      decideSeatToggle({
        seatKey: "f1:b1:0:0",
        state: "purchased",
        selectedSeatKeys: ["f1:b1:0:0"],
        requiredCount: 1,
      }),
    ).toEqual({ action: "remove", next: [] });
  });
});
