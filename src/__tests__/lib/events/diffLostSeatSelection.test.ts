import { describe, expect, it } from "vitest";
import { diffLostSeatSelection } from "@/lib/events/diffLostSeatSelection";

describe("diffLostSeatSelection", () => {
  it("keeps the seats that are still free and names the lost ones", () => {
    expect(
      diffLostSeatSelection({
        selectedSeatKeys: ["a", "b", "c"],
        unavailableSeatKeys: ["b"],
      }),
    ).toEqual({ kept: ["a", "c"], lost: ["b"] });
  });
});
