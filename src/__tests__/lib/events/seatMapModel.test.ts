import { describe, expect, it } from "vitest";
import {
  countEventSeatMapCapacity,
  createDefaultEventSeatMapConfig,
  generateFloorSeats,
  parseEventSeatMapConfig,
  sanitizeEventSeatMapConfig,
  stripEventSeatMapGuideImages,
  type EventSeatMapConfig,
} from "@/lib/events/seatMapModel";
import {
  resolveFloorSeatsWithState,
  validateEventSeatSelection,
} from "@/lib/events/seatMapState";
import {
  applySeatBrushToBlock,
  applyStagePositionToFloor,
  buildResponsiveSeatGridLayout,
  collectColCellKeys,
  collectRectCellKeys,
  collectRowCellKeys,
  createDefaultFloorWithMatrix,
  ensureFloorHasMatrixBlock,
  resolveStagePosition,
} from "@/lib/events/seatMapMatrixPainter";

const sampleConfig: EventSeatMapConfig = {
  enabled: true,
  floors: [
    {
      id: "platea-baja",
      name: "Platea Baja",
      order: 0,
      guideImageUrl: "https://example.com/admin-guide.png",
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
          reservedSeats: ["1:0"],
        },
      ],
    },
  ],
};

describe("seatMapModel and seatMapState", () => {
  it("creates a disabled default config, parses valid JSON, and strips admin guide images", () => {
    const def = createDefaultEventSeatMapConfig();
    expect(def.enabled).toBe(false);
    expect(def.floors).toEqual([]);

    expect(parseEventSeatMapConfig(null)).toBeNull();
    const parsed = parseEventSeatMapConfig(sampleConfig);
    expect(parsed?.enabled).toBe(true);
    expect(parsed?.floors[0]?.guideImageUrl).toBe("https://example.com/admin-guide.png");

    const publicSafe = stripEventSeatMapGuideImages(sampleConfig);
    expect(publicSafe.floors[0]?.guideImageUrl).toBeNull();

    expect(sanitizeEventSeatMapConfig({ ...sampleConfig, enabled: false })).toEqual({
      ...sampleConfig,
      enabled: false,
      floors: [
        expect.objectContaining({
          id: "platea-baja",
          name: "Platea Baja",
        }),
      ],
    });
  });

  it("generates floor seats with row+number labels, aisle split gap, hidden filtering, and capacity counts", () => {
    const floor = sampleConfig.floors[0]!;
    const seats = generateFloorSeats(floor);

    // 2 rows * 4 cols = 8 cells, minus 1 hidden ("0:3") = 7 visible seats
    expect(seats).toHaveLength(7);
    expect(seats[0]).toMatchObject({
      seatKey: "platea-baja:blk-1:0:0",
      rowLabel: "A",
      seatNumber: 1,
      seatLabel: "Platea Baja · A-1",
      staffReserved: false,
    });
    expect(seats.find((s) => s.seatKey === "platea-baja:blk-1:0:3")).toBeUndefined();

    // Central aisle split puts a larger gap between col 1 (left half) and col 2 (right half)
    const row0Col0 = seats.find((s) => s.seatKey === "platea-baja:blk-1:0:0")!;
    const row0Col1 = seats.find((s) => s.seatKey === "platea-baja:blk-1:0:1")!;
    const row0Col2 = seats.find((s) => s.seatKey === "platea-baja:blk-1:0:2")!;
    const normalStep = row0Col1.cx - row0Col0.cx;
    const aisleStep = row0Col2.cx - row0Col1.cx;
    expect(aisleStep).toBeGreaterThan(normalStep);

    const counts = countEventSeatMapCapacity(sampleConfig);
    expect(counts).toEqual({
      totalVisibleSeats: 7,
      staffReservedSeats: 1,
      purchasableSeats: 6,
    });
    expect(countEventSeatMapCapacity(null)).toEqual({
      totalVisibleSeats: 0,
      staffReservedSeats: 0,
      purchasableSeats: 0,
    });
  });

  it("resolves seat visual states and validates buyer selections against locks", () => {
    const floor = sampleConfig.floors[0]!;
    const locks = [
      { seatKey: "platea-baja:blk-1:0:0", attendeeStatus: "pending_payment" as const },
      { seatKey: "platea-baja:blk-1:0:1", attendeeStatus: "confirmed" as const },
    ];

    const withStates = resolveFloorSeatsWithState(floor, locks);
    expect(withStates.find((s) => s.seatKey === "platea-baja:blk-1:0:0")?.state).toBe("pending");
    expect(withStates.find((s) => s.seatKey === "platea-baja:blk-1:0:1")?.state).toBe("purchased");
    expect(withStates.find((s) => s.seatKey === "platea-baja:blk-1:1:0")?.state).toBe("reserved");
    expect(withStates.find((s) => s.seatKey === "platea-baja:blk-1:0:2")?.state).toBe("free");

    // Disabled seat map skips seat validation
    expect(
      validateEventSeatSelection({
        config: { ...sampleConfig, enabled: false },
        locks,
        selectedSeatKeys: [],
        requiredSeatCount: 2,
      }),
    ).toEqual({ ok: true, assignedSeats: [] });

    // Count mismatch
    expect(
      validateEventSeatSelection({
        config: sampleConfig,
        locks,
        selectedSeatKeys: ["platea-baja:blk-1:0:2"],
        requiredSeatCount: 2,
      }),
    ).toEqual({ ok: false, code: "seat_count_mismatch" });

    // Hidden or unknown seat
    expect(
      validateEventSeatSelection({
        config: sampleConfig,
        locks,
        selectedSeatKeys: ["platea-baja:blk-1:0:3"],
        requiredSeatCount: 1,
      }),
    ).toEqual({ ok: false, code: "invalid_seat" });

    // Already pending/purchased/reserved seat
    expect(
      validateEventSeatSelection({
        config: sampleConfig,
        locks,
        selectedSeatKeys: ["platea-baja:blk-1:0:0"],
        requiredSeatCount: 1,
      }),
    ).toEqual({ ok: false, code: "seat_already_taken" });

    // Valid selection of 2 free seats
    expect(
      validateEventSeatSelection({
        config: sampleConfig,
        locks,
        selectedSeatKeys: ["platea-baja:blk-1:0:2", "platea-baja:blk-1:1:1"],
        requiredSeatCount: 2,
      }),
    ).toEqual({
      ok: true,
      assignedSeats: [
        { seatKey: "platea-baja:blk-1:0:2", seatLabel: "Platea Baja · A-3" },
        { seatKey: "platea-baja:blk-1:1:1", seatLabel: "Platea Baja · B-2" },
      ],
    });
  });

  it("creates a default visible matrix floor and paints rectangular/row/col selections with brushes", () => {
    const floor = createDefaultFloorWithMatrix(0, "Platea Baja");
    expect(floor.blocks).toHaveLength(1);
    const initialSeats = generateFloorSeats(floor);
    expect(initialSeats.length).toBe(floor.blocks[0]!.rows * floor.blocks[0]!.cols);

    const rectKeys = collectRectCellKeys(0, 1, 1, 2);
    expect(rectKeys).toEqual(["0:1", "0:2", "1:1", "1:2"]);

    const afterHidden = applySeatBrushToBlock(floor.blocks[0]!, rectKeys, "hidden");
    expect(afterHidden.hiddenSeats).toEqual(["0:1", "0:2", "1:1", "1:2"]);
    expect(afterHidden.reservedSeats).toEqual([]);

    const row0Keys = collectRowCellKeys(0, 4);
    const afterReserved = applySeatBrushToBlock(afterHidden, row0Keys, "reserved");
    expect(afterReserved.reservedSeats).toEqual(["0:0", "0:1", "0:2", "0:3"]);
    expect(afterReserved.hiddenSeats).toEqual(["1:1", "1:2"]);

    const col1Keys = collectColCellKeys(1, 2);
    const afterFree = applySeatBrushToBlock(afterReserved, col1Keys, "free");
    expect(afterFree.reservedSeats).toEqual(["0:0", "0:2", "0:3"]);
    expect(afterFree.hiddenSeats).toEqual(["1:2"]);

    // Auto-renumbering skips hidden aisle cells in row 1 ("1:2" is hidden)
    const updatedFloor = { ...floor, blocks: [afterFree] };
    const row1Visible = generateFloorSeats(updatedFloor).filter((s) => s.rowIndex === 1);
    expect(row1Visible.slice(0, 4).map((s) => s.seatNumber)).toEqual([1, 2, 3, 4]);
    expect(row1Visible.slice(0, 4).map((s) => s.colIndex)).toEqual([0, 1, 3, 4]);

    const gridLayout = buildResponsiveSeatGridLayout(afterFree, { includeRightLabel: true });
    expect(gridLayout.aisleCol).toBe(8);
    expect(gridLayout.gridTemplateColumns).toContain("minmax(6px, 0.7fr)");
    expect(gridLayout.maxWidthCss).toContain("calc(58vh *");
  });

  it("numbers numeric rows, wraps Z, and places the stage on every side", () => {
    const numeric = generateFloorSeats({
      ...sampleConfig.floors[0]!,
      blocks: [{ ...sampleConfig.floors[0]!.blocks[0]!, startRowLabel: "1", rows: 2, cols: 1, splitIntoTwo: false, hiddenSeats: [], reservedSeats: [] }],
    });
    expect(numeric.map((seat) => seat.rowLabel)).toEqual(["1", "2"]);

    const wrapped = generateFloorSeats({
      ...sampleConfig.floors[0]!,
      blocks: [{ ...sampleConfig.floors[0]!.blocks[0]!, startRowLabel: "Z", rows: 2, cols: 1, splitIntoTwo: false, hiddenSeats: [], reservedSeats: [] }],
    });
    expect(wrapped.map((seat) => seat.rowLabel)).toEqual(["Z", "AA"]);

    const odd = generateFloorSeats({
      ...sampleConfig.floors[0]!,
      blocks: [{ ...sampleConfig.floors[0]!.blocks[0]!, startRowLabel: "*", rows: 1, cols: 1, splitIntoTwo: false, hiddenSeats: [], reservedSeats: [] }],
    });
    expect(odd[0]?.rowLabel).toBe("*1");

    const floor = createDefaultFloorWithMatrix(1);
    expect(resolveStagePosition({ ...floor.stage, position: "left" })).toBe("left");
    expect(resolveStagePosition({ ...floor.stage, position: undefined, height: 200, width: 40, x: 10, y: 10 })).toBe("left");
    expect(resolveStagePosition({ ...floor.stage, position: undefined, height: 200, width: 40, x: 800, y: 10 })).toBe("right");
    expect(resolveStagePosition({ ...floor.stage, position: undefined, height: 40, width: 200, x: 10, y: 800 })).toBe("bottom");
    expect(resolveStagePosition({ ...floor.stage, position: undefined, height: 40, width: 200, x: 10, y: 10 })).toBe("top");

    expect(applyStagePositionToFloor(floor, "bottom").stage.position).toBe("bottom");
    expect(applyStagePositionToFloor(floor, "left").stage.position).toBe("left");
    expect(applyStagePositionToFloor(floor, "right").blocks[0]?.x).toBe(40);
    expect(applyStagePositionToFloor(floor, "top").stage.position).toBe("top");
    expect(ensureFloorHasMatrixBlock({ ...floor, blocks: [] }).blocks).toHaveLength(1);
    expect(ensureFloorHasMatrixBlock(floor).blocks).toHaveLength(1);
  });
});
