import {
  generateFloorSeats,
  resolveBlockAisleCol,
  type EventSeatMapConfig,
} from "@/lib/events/seatMapModel";

export interface SelectedSeatPreviewCell {
  seatLabel: string;
  seatNumber: number;
  rowLabel: string;
  gridRow: number;
  gridCol: number;
}

export interface SelectedSeatPreviewBlock {
  id: string;
  floorName: string;
  blockLabel: string;
  stageLabel: string;
  rowCount: number;
  colCount: number;
  cells: SelectedSeatPreviewCell[];
}

function virtualCol(colIndex: number, aisleCol: number): number {
  if (aisleCol < 1 || colIndex < aisleCol) return colIndex;
  return colIndex + 1;
}

export function buildSelectedSeatPreview(
  config: EventSeatMapConfig | null | undefined,
  seatLabels: readonly string[],
): SelectedSeatPreviewBlock[] {
  const wanted = new Set(seatLabels.map((label) => label.trim()).filter(Boolean));
  if (!config || wanted.size === 0) return [];

  const blocks: SelectedSeatPreviewBlock[] = [];
  for (const floor of config.floors) {
    const selectedByBlock = new Map<string, ReturnType<typeof generateFloorSeats>>();
    for (const seat of generateFloorSeats(floor)) {
      if (!wanted.has(seat.seatLabel)) continue;
      const list = selectedByBlock.get(seat.blockId) ?? [];
      list.push(seat);
      selectedByBlock.set(seat.blockId, list);
    }

    for (const block of floor.blocks) {
      const selected = selectedByBlock.get(block.id);
      if (!selected || selected.length === 0) continue;
      const aisleCol = resolveBlockAisleCol(block);
      const minRow = Math.min(...selected.map((seat) => seat.rowIndex));
      const maxRow = Math.max(...selected.map((seat) => seat.rowIndex));
      const virtuals = selected.map((seat) => virtualCol(seat.colIndex, aisleCol));
      const minCol = Math.min(...virtuals);
      const maxCol = Math.max(...virtuals);
      blocks.push({
        id: `${floor.id}:${block.id}`,
        floorName: floor.name,
        blockLabel: block.label,
        stageLabel: floor.stage.label,
        rowCount: maxRow - minRow + 1,
        colCount: maxCol - minCol + 1,
        cells: selected.map((seat) => ({
          seatLabel: seat.seatLabel,
          seatNumber: seat.seatNumber,
          rowLabel: seat.rowLabel,
          gridRow: seat.rowIndex - minRow + 1,
          gridCol: virtualCol(seat.colIndex, aisleCol) - minCol + 1,
        })),
      });
    }
  }
  return blocks;
}
