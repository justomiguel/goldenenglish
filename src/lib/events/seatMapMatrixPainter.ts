import {
  resolveBlockAisleCol,
  type EventSeatBlock,
  type EventSeatFloor,
  type EventSeatStage,
  type EventSeatStagePosition,
} from "@/lib/events/seatMapModel";

export type SeatPaintBrush = "free" | "reserved" | "hidden";

export function resolveStagePosition(stage: EventSeatStage): EventSeatStagePosition {
  if (
    stage.position === "top" ||
    stage.position === "bottom" ||
    stage.position === "left" ||
    stage.position === "right"
  ) {
    return stage.position;
  }
  if (stage.height > stage.width) {
    return stage.x < 500 ? "left" : "right";
  }
  return stage.y > 500 ? "bottom" : "top";
}

export function applyStagePositionToFloor(
  floor: EventSeatFloor,
  position: EventSeatStagePosition,
): EventSeatFloor {
  const label = floor.stage.label;
  let stage: EventSeatStage = {
    x: 200,
    y: 24,
    width: 600,
    height: 56,
    label,
    position: "top",
  };
  let blockBounds = { x: 40, y: 110, width: 920, height: 850 };

  if (position === "bottom") {
    stage = { x: 200, y: 920, width: 600, height: 56, label, position: "bottom" };
    blockBounds = { x: 40, y: 40, width: 920, height: 850 };
  } else if (position === "left") {
    stage = { x: 24, y: 200, width: 64, height: 600, label, position: "left" };
    blockBounds = { x: 116, y: 40, width: 844, height: 920 };
  } else if (position === "right") {
    stage = { x: 912, y: 200, width: 64, height: 600, label, position: "right" };
    blockBounds = { x: 40, y: 40, width: 844, height: 920 };
  }

  return {
    ...floor,
    stage,
    blocks: floor.blocks.map((block, index) =>
      index === 0 ? { ...block, ...blockBounds } : block,
    ),
  };
}

export function createDefaultMatrixBlock(index = 0): EventSeatBlock {
  return {
    id: `matrix-${index + 1}`,
    label: `Sector ${index + 1}`,
    x: 40,
    y: 120,
    width: 920,
    height: 820,
    rows: 10,
    cols: 16,
    startRowLabel: "A",
    startSeatNumber: 1,
    splitIntoTwo: true,
    hiddenSeats: [],
    reservedSeats: [],
  };
}

export function createDefaultFloorWithMatrix(
  index: number,
  name = `Piso ${index + 1}`,
): EventSeatFloor {
  return {
    id: `floor-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    order: index,
    guideImageUrl: null,
    stage: { x: 200, y: 24, width: 600, height: 56, label: "ESCENARIO" },
    blocks: [createDefaultMatrixBlock(0)],
  };
}

export function ensureFloorHasMatrixBlock(floor: EventSeatFloor): EventSeatFloor {
  if (floor.blocks.length > 0) return floor;
  return {
    ...floor,
    blocks: [createDefaultMatrixBlock(0)],
  };
}

export function collectRectCellKeys(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): string[] {
  const minR = Math.min(r1, r2);
  const maxR = Math.max(r1, r2);
  const minC = Math.min(c1, c2);
  const maxC = Math.max(c1, c2);
  const keys: string[] = [];
  for (let r = minR; r <= maxR; r += 1) {
    for (let c = minC; c <= maxC; c += 1) {
      keys.push(`${r}:${c}`);
    }
  }
  return keys;
}

export function collectRowCellKeys(rowIndex: number, cols: number): string[] {
  return collectRectCellKeys(rowIndex, 0, rowIndex, Math.max(0, cols - 1));
}

export function collectColCellKeys(colIndex: number, rows: number): string[] {
  return collectRectCellKeys(0, colIndex, Math.max(0, rows - 1), colIndex);
}

export function applySeatBrushToBlock(
  block: EventSeatBlock,
  localKeys: readonly string[],
  brush: SeatPaintBrush,
): EventSeatBlock {
  const targetSet = new Set(localKeys);
  const nextHidden = new Set(block.hiddenSeats);
  const nextReserved = new Set(block.reservedSeats);

  for (const key of targetSet) {
    if (brush === "free") {
      nextHidden.delete(key);
      nextReserved.delete(key);
    } else if (brush === "reserved") {
      nextHidden.delete(key);
      nextReserved.add(key);
    } else {
      nextReserved.delete(key);
      nextHidden.add(key);
    }
  }

  return {
    ...block,
    hiddenSeats: [...nextHidden],
    reservedSeats: [...nextReserved],
  };
}

export function buildResponsiveSeatGridLayout(
  block: Pick<EventSeatBlock, "rows" | "cols" | "splitIntoTwo" | "aisleAfterCol">,
  options?: { includeRightLabel?: boolean; maxSeatPx?: number },
): {
  aisleCol: number;
  gridTemplateColumns: string;
  maxWidthCss: string;
} {
  const cols = Math.max(1, block.cols);
  const rows = Math.max(1, block.rows);
  const aisleCol = resolveBlockAisleCol(block);
  const includeRight = options?.includeRightLabel ?? true;
  const maxSeatPx = options?.maxSeatPx ?? 40;

  const tracks: string[] = ["minmax(14px, 0.75fr)"];
  for (let c = 0; c < cols; c += 1) {
    if (c === aisleCol) {
      tracks.push("minmax(6px, 0.7fr)");
    }
    tracks.push("minmax(0, 1fr)");
  }
  if (includeRight) {
    tracks.push("minmax(14px, 0.75fr)");
  }

  const virtualCols =
    cols + (aisleCol > 0 ? 0.7 : 0) + (includeRight ? 1.5 : 0.75);
  const aspectRatio = (virtualCols / rows).toFixed(2);
  const naturalMaxPx = Math.round(virtualCols * maxSeatPx);

  return {
    aisleCol,
    gridTemplateColumns: tracks.join(" "),
    maxWidthCss: `min(100%, ${naturalMaxPx}px, calc(58vh * ${aspectRatio}))`,
  };
}
