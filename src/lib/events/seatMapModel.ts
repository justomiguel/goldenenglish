import { z } from "zod";

export const SEAT_MAP_CANVAS_SIZE = 1000;

export type EventSeatStagePosition = "top" | "bottom" | "left" | "right";

export interface EventSeatStage {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  position?: EventSeatStagePosition;
}

export interface EventSeatBlock {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rows: number;
  cols: number;
  startRowLabel: string;
  startSeatNumber: number;
  splitIntoTwo: boolean;
  aisleAfterCol?: number | null;
  hiddenSeats: string[];
  reservedSeats: string[];
}

export interface EventSeatFloor {
  id: string;
  name: string;
  order: number;
  guideImageUrl: string | null;
  stage: EventSeatStage;
  blocks: EventSeatBlock[];
}

export interface EventSeatMapConfig {
  enabled: boolean;
  floors: EventSeatFloor[];
}

export interface GeneratedFloorSeat {
  seatKey: string;
  floorId: string;
  floorName: string;
  blockId: string;
  blockLabel: string;
  localKey: string;
  rowIndex: number;
  colIndex: number;
  rowLabel: string;
  seatNumber: number;
  seatLabel: string;
  cx: number;
  cy: number;
  radius: number;
  hidden: boolean;
  staffReserved: boolean;
}

const stageSchema = z.object({
  x: z.number().min(0).max(SEAT_MAP_CANVAS_SIZE).default(200),
  y: z.number().min(0).max(SEAT_MAP_CANVAS_SIZE).default(30),
  width: z.number().min(20).max(SEAT_MAP_CANVAS_SIZE).default(600),
  height: z.number().min(20).max(SEAT_MAP_CANVAS_SIZE).default(60),
  label: z.string().trim().max(80).default("ESCENARIO"),
  position: z.enum(["top", "bottom", "left", "right"]).optional(),
});

const blockSchema = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().max(80).default(""),
  x: z.number().min(0).max(SEAT_MAP_CANVAS_SIZE),
  y: z.number().min(0).max(SEAT_MAP_CANVAS_SIZE),
  width: z.number().min(20).max(SEAT_MAP_CANVAS_SIZE),
  height: z.number().min(20).max(SEAT_MAP_CANVAS_SIZE),
  rows: z.number().int().min(1).max(100),
  cols: z.number().int().min(1).max(100),
  startRowLabel: z.string().trim().min(1).max(8).default("A"),
  startSeatNumber: z.number().int().min(1).max(999).default(1),
  splitIntoTwo: z.boolean().default(false),
  aisleAfterCol: z.number().int().min(1).max(99).nullable().optional(),
  hiddenSeats: z.array(z.string().trim().max(16)).max(10000).default([]),
  reservedSeats: z.array(z.string().trim().max(16)).max(10000).default([]),
});

const floorSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(80),
  order: z.number().int().min(0).max(50).default(0),
  guideImageUrl: z.string().trim().max(1000).nullable().default(null),
  stage: stageSchema.default({
    x: 200,
    y: 30,
    width: 600,
    height: 60,
    label: "ESCENARIO",
  }),
  blocks: z.array(blockSchema).max(40).default([]),
});

const seatMapConfigSchema = z.object({
  enabled: z.boolean().default(false),
  floors: z.array(floorSchema).max(12).default([]),
});

export function createDefaultEventSeatMapConfig(): EventSeatMapConfig {
  return { enabled: false, floors: [] };
}

export function parseEventSeatMapConfig(raw: unknown): EventSeatMapConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = seatMapConfigSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

export function sanitizeEventSeatMapConfig(raw: unknown): EventSeatMapConfig | null {
  const parsed = parseEventSeatMapConfig(raw);
  if (!parsed) return null;
  return {
    enabled: parsed.enabled,
    floors: parsed.floors.map((floor, index) => ({
      ...floor,
      order: index,
      guideImageUrl: floor.guideImageUrl?.trim() || null,
      blocks: floor.blocks.map((block) => ({
        ...block,
        hiddenSeats: [...new Set(block.hiddenSeats)],
        reservedSeats: [...new Set(block.reservedSeats)],
      })),
    })),
  };
}

export function stripEventSeatMapGuideImages(config: EventSeatMapConfig): EventSeatMapConfig {
  return {
    ...config,
    floors: config.floors.map((floor) => ({ ...floor, guideImageUrl: null })),
  };
}

function advanceRowLabel(startLabel: string, offset: number): string {
  const clean = startLabel.trim().toUpperCase() || "A";
  const numeric = Number.parseInt(clean, 10);
  if (Number.isFinite(numeric) && String(numeric) === clean) {
    return String(numeric + offset);
  }
  const baseCode = clean.charCodeAt(clean.length - 1) - 65;
  if (baseCode < 0 || baseCode > 25) return `${clean}${offset + 1}`;
  const total = baseCode + offset;
  const prefixCount = Math.floor(total / 26);
  const char = String.fromCharCode(65 + (total % 26));
  const prefix = clean.slice(0, -1);
  return prefixCount > 0 ? `${prefix}${String.fromCharCode(64 + prefixCount)}${char}` : `${prefix}${char}`;
}

export function resolveBlockAisleCol(
  block: Pick<EventSeatBlock, "cols" | "splitIntoTwo" | "aisleAfterCol">,
): number {
  if (!block.splitIntoTwo || block.cols < 2) return -1;
  const fallback = Math.floor(block.cols / 2);
  const raw = block.aisleAfterCol;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return fallback;
  return Math.max(1, Math.min(block.cols - 1, Math.round(raw)));
}

export function generateFloorCells(floor: EventSeatFloor): GeneratedFloorSeat[] {
  const cells: GeneratedFloorSeat[] = [];
  for (const block of floor.blocks) {
    const hiddenSet = new Set(block.hiddenSeats);
    const reservedSet = new Set(block.reservedSeats);
    const aisleCol = resolveBlockAisleCol(block);
    const hasAisle = aisleCol > 0;
    const aisleGapCols = 2.5;
    const virtualCols = hasAisle ? block.cols + aisleGapCols : block.cols;
    const cellW = block.width / virtualCols;
    const cellH = block.height / block.rows;
    const radius = Math.max(4, Math.min(18, Math.min(cellW, cellH) * 0.36));

    for (let r = 0; r < block.rows; r += 1) {
      const rowLabel = advanceRowLabel(block.startRowLabel, r);
      const cy = block.y + (r + 0.5) * cellH;
      let visibleSeatSequence = 0;
      for (let c = 0; c < block.cols; c += 1) {
        const localKey = `${r}:${c}`;
        const isHidden = hiddenSet.has(localKey);
        const seatNumber = isHidden ? 0 : block.startSeatNumber + visibleSeatSequence;
        if (!isHidden) visibleSeatSequence += 1;
        const virtualC = hasAisle && c >= aisleCol ? c + aisleGapCols : c;
        const cx = block.x + (virtualC + 0.5) * cellW;
        const seatKey = `${floor.id}:${block.id}:${r}:${c}`;
        const seatLabel = isHidden ? `${floor.name} · ${rowLabel}` : `${floor.name} · ${rowLabel}-${seatNumber}`;
        cells.push({
          seatKey,
          floorId: floor.id,
          floorName: floor.name,
          blockId: block.id,
          blockLabel: block.label,
          localKey,
          rowIndex: r,
          colIndex: c,
          rowLabel,
          seatNumber,
          seatLabel,
          cx,
          cy,
          radius,
          hidden: isHidden,
          staffReserved: reservedSet.has(localKey),
        });
      }
    }
  }
  return cells;
}

export function generateFloorSeats(floor: EventSeatFloor): GeneratedFloorSeat[] {
  return generateFloorCells(floor).filter((cell) => !cell.hidden);
}

export function countEventSeatMapCapacity(config: EventSeatMapConfig | null): {
  totalVisibleSeats: number;
  staffReservedSeats: number;
  purchasableSeats: number;
} {
  if (!config) {
    return { totalVisibleSeats: 0, staffReservedSeats: 0, purchasableSeats: 0 };
  }
  let totalVisibleSeats = 0;
  let staffReservedSeats = 0;
  for (const floor of config.floors) {
    for (const seat of generateFloorSeats(floor)) {
      totalVisibleSeats += 1;
      if (seat.staffReserved) staffReservedSeats += 1;
    }
  }
  return {
    totalVisibleSeats,
    staffReservedSeats,
    purchasableSeats: Math.max(0, totalVisibleSeats - staffReservedSeats),
  };
}
