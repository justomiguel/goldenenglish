import { describe, expect, it } from "vitest";
import { buildSelectedSeatPreview } from "@/lib/events/selectedSeatPreview";
import type { EventSeatMapConfig } from "@/lib/events/seatMapModel";

const config: EventSeatMapConfig = {
  enabled: true,
  floors: [
    {
      id: "platea-baja",
      name: "Platea Baja",
      order: 0,
      guideImageUrl: null,
      stage: { x: 200, y: 40, width: 600, height: 60, label: "ESCENARIO" },
      blocks: [
        {
          id: "blk-1",
          label: "Central",
          x: 100,
          y: 160,
          width: 800,
          height: 200,
          rows: 2,
          cols: 4,
          startRowLabel: "A",
          startSeatNumber: 1,
          splitIntoTwo: true,
          hiddenSeats: ["0:3"],
          reservedSeats: [],
        },
      ],
    },
  ],
};

describe("buildSelectedSeatPreview", () => {
  it("crops to the selected seats and keeps the aisle gap", () => {
    const blocks = buildSelectedSeatPreview(config, [
      "Platea Baja · A-1",
      "Platea Baja · A-3",
    ]);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      stageLabel: "ESCENARIO",
      floorName: "Platea Baja",
      blockLabel: "Central",
      rowCount: 1,
      colCount: 4,
    });
    expect(blocks[0]?.cells.map((cell) => cell.seatNumber).toSorted()).toEqual([1, 3]);
    const left = blocks[0]?.cells.find((cell) => cell.seatNumber === 1);
    const right = blocks[0]?.cells.find((cell) => cell.seatNumber === 3);
    expect(right && left ? right.gridCol - left.gridCol : 0).toBeGreaterThan(1);
  });

  it("drops seats the person did not select", () => {
    const blocks = buildSelectedSeatPreview(config, ["Platea Baja · A-1", "Platea Baja · B-4"]);
    const numbers = blocks[0]?.cells.map((cell) => cell.seatNumber) ?? [];
    expect(numbers).not.toContain(2);
    expect(blocks[0]?.rowCount).toBe(2);
  });

  it("returns nothing when the labels do not match the map", () => {
    expect(buildSelectedSeatPreview(config, ["Fila inventada"])).toEqual([]);
    expect(buildSelectedSeatPreview(null, ["Platea Baja · A-1"])).toEqual([]);
  });
});
