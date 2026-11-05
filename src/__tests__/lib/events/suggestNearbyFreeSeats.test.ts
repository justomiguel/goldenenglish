import { describe, expect, it } from "vitest";
import type { EventSeatMapConfig } from "@/lib/events/seatMapModel";
import { suggestNearbyFreeSeats } from "@/lib/events/suggestNearbyFreeSeats";

const config: EventSeatMapConfig = {
  enabled: true,
  floors: [
    {
      id: "f1",
      name: "Platea",
      order: 0,
      guideImageUrl: null,
      stage: { x: 0, y: 0, width: 100, height: 20, label: "STAGE" },
      blocks: [
        {
          id: "b1",
          label: "Main",
          x: 0,
          y: 40,
          width: 200,
          height: 80,
          rows: 2,
          cols: 3,
          startRowLabel: "A",
          startSeatNumber: 1,
          hiddenSeats: [],
          reservedSeats: [],
        },
      ],
    },
  ],
};

describe("suggestNearbyFreeSeats", () => {
  it("suggests the nearest free seat on the same row first", () => {
    const lost = "f1:b1:0:1";
    const suggestions = suggestNearbyFreeSeats({
      config,
      locks: [{ seatKey: lost, attendeeStatus: "confirmed" }],
      heldByOthers: ["f1:b1:0:2"],
      lostSeatKeys: [lost],
      neededCount: 1,
    });
    expect(suggestions).toEqual(["f1:b1:0:0"]);
  });
});
