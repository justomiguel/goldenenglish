"use client";

import { useState } from "react";
import { Eraser, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  buildResponsiveSeatGridLayout,
  collectColCellKeys,
  collectRectCellKeys,
  collectRowCellKeys,
  resolveStagePosition,
  type SeatPaintBrush,
} from "@/lib/events/seatMapMatrixPainter";
import {
  generateFloorCells,
  type EventSeatBlock,
  type EventSeatFloor,
} from "@/lib/events/seatMapModel";
import type { EventSeatLockSnapshot } from "@/lib/events/seatMapState";
import type { AdminEventSeatMapLabels } from "@/components/dashboard/admin/events/seat-map/AdminEventSeatBlockInspector";

interface AdminEventSeatMapCanvasProps {
  floor: EventSeatFloor;
  block: EventSeatBlock;
  seatLocks: readonly EventSeatLockSnapshot[];
  labels: AdminEventSeatMapLabels;
  onPaintCells: (localKeys: string[], brush: SeatPaintBrush) => void;
  onResetAllAvailable: () => void;
}

export function AdminEventSeatMapCanvas({
  floor,
  block,
  seatLocks,
  labels,
  onPaintCells,
  onResetAllAvailable,
}: AdminEventSeatMapCanvasProps) {
  const [mode, setMode] = useState<"toggle_hidden" | "reserved">("toggle_hidden");
  const [dragStart, setDragStart] = useState<{ r: number; c: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ r: number; c: number } | null>(null);
  const [strokeBrush, setStrokeBrush] = useState<SeatPaintBrush>("hidden");

  const lockMap = new Map<string, "pending_payment" | "confirmed">();
  for (const lock of seatLocks) {
    lockMap.set(lock.seatKey, lock.attendeeStatus);
  }

  const cells = generateFloorCells({ ...floor, blocks: [block] });
  const cellByRowCol = new Map<string, (typeof cells)[number]>();
  const rowLabels: string[] = [];
  for (const cell of cells) {
    cellByRowCol.set(cell.localKey, cell);
    if (cell.colIndex === 0) rowLabels[cell.rowIndex] = cell.rowLabel;
  }

  const activeDragKeys = new Set(
    dragStart && dragCurrent
      ? collectRectCellKeys(dragStart.r, dragStart.c, dragCurrent.r, dragCurrent.c)
      : [],
  );

  function resolveStrokeBrushForCell(localKey: string): SeatPaintBrush {
    const cell = cellByRowCol.get(localKey);
    if (mode === "reserved") return cell?.staffReserved ? "free" : "reserved";
    return cell?.hidden ? "free" : "hidden";
  }

  function resolveStrokeBrushForLine(localKeys: string[]): SeatPaintBrush {
    if (mode === "reserved") {
      const allReserved = localKeys.every((key) => cellByRowCol.get(key)?.staffReserved);
      return allReserved ? "free" : "reserved";
    }
    const allHidden = localKeys.every((key) => cellByRowCol.get(key)?.hidden);
    return allHidden ? "free" : "hidden";
  }

  function finishDrag() {
    if (dragStart && dragCurrent) {
      const keys = collectRectCellKeys(dragStart.r, dragStart.c, dragCurrent.r, dragCurrent.c);
      onPaintCells(keys, strokeBrush);
    }
    setDragStart(null);
    setDragCurrent(null);
  }

  const layout = buildResponsiveSeatGridLayout(block, { includeRightLabel: false, maxSeatPx: 34 });
  const stagePos = resolveStagePosition(floor.stage);
  const stageBannerH = (
    <div className="w-full px-6">
      <div className="mx-auto w-full max-w-md rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-6 py-1.5 text-center text-xs font-bold tracking-widest text-[var(--color-foreground)]">
        {floor.stage.label}
      </div>
    </div>
  );
  const stageBannerV = (
    <div className="mt-6 flex min-w-8 items-center justify-center rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-6 text-center text-xs font-bold tracking-widest text-[var(--color-foreground)] [writing-mode:vertical-rl]">
      {floor.stage.label}
    </div>
  );

  return (
    <div
      className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4"
      onMouseUp={finishDrag}
      onMouseLeave={() => {
        if (dragStart) finishDrag();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.step2Title}</h4>
          <p className="text-xs text-[var(--color-muted-foreground)]">{labels.step2Hint}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant={mode === "toggle_hidden" ? "primary" : "ghost"} onClick={() => setMode("toggle_hidden")}>
            <Eraser className="h-4 w-4" aria-hidden />
            {labels.brushHidden}
          </Button>
          <Button type="button" variant={mode === "reserved" ? "secondary" : "ghost"} onClick={() => setMode("reserved")}>
            <Lock className="h-4 w-4" aria-hidden />
            {labels.brushReserved}
          </Button>
          <Button type="button" variant="ghost" onClick={onResetAllAvailable}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {labels.resetAllAvailable}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-[var(--color-muted-foreground)]">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[var(--color-primary)]" aria-hidden />{labels.legendFree}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-dashed border-[var(--color-border)] bg-transparent" aria-hidden />{labels.legendHidden}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[var(--color-secondary)]" aria-hidden />{labels.legendReserved}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[var(--color-warning)]" aria-hidden />{labels.legendPending}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[var(--color-muted-foreground)]" aria-hidden />{labels.legendPurchased}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 sm:p-4">
        <div className="mx-auto flex w-full items-stretch justify-center gap-3">
          {stagePos === "left" ? stageBannerV : null}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
            {stagePos === "top" ? stageBannerH : null}
            <div style={{ maxWidth: layout.maxWidthCss }} className="w-full select-none space-y-1">
              <div style={{ gridTemplateColumns: layout.gridTemplateColumns }} className="grid w-full items-center gap-0.5 sm:gap-1">
                <span aria-hidden="true" />
                {Array.from({ length: block.cols }, (_, c) => {
                  const colNum = c + 1;
                  const aria = labels.paintColAria.replace("{col}", String(colNum));
                  return (
                    <span key={`col-hdr-${c}`} className="contents">
                      {c === layout.aisleCol ? <span aria-hidden="true" /> : null}
                      <button
                        type="button"
                        aria-label={aria}
                        title={aria}
                        onClick={() => {
                          const colKeys = collectColCellKeys(c, block.rows);
                          onPaintCells(colKeys, resolveStrokeBrushForLine(colKeys));
                        }}
                        className="flex aspect-square w-full items-center justify-center rounded text-[10px] font-semibold text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                      >
                        {colNum}
                      </button>
                    </span>
                  );
                })}
              </div>

              {Array.from({ length: block.rows }, (_, r) => {
                const rowLabel = rowLabels[r] ?? String(r + 1);
                const rowAria = labels.paintRowAria.replace("{row}", rowLabel);
                return (
                  <div
                    key={`row-${r}`}
                    style={{ gridTemplateColumns: layout.gridTemplateColumns }}
                    className="grid w-full items-center gap-0.5 sm:gap-1"
                  >
                    <button
                      type="button"
                      aria-label={rowAria}
                      title={rowAria}
                      onClick={() => {
                        const rowKeys = collectRowCellKeys(r, block.cols);
                        onPaintCells(rowKeys, resolveStrokeBrushForLine(rowKeys));
                      }}
                      className="flex aspect-square w-full items-center justify-center rounded text-[10px] font-bold text-[var(--color-foreground)] hover:bg-[var(--color-muted)] sm:text-xs"
                    >
                      {rowLabel}
                    </button>

                    {Array.from({ length: block.cols }, (_, c) => {
                      const localKey = `${r}:${c}`;
                      const cell = cellByRowCol.get(localKey);
                      if (!cell) return null;
                      const lockStatus = lockMap.get(cell.seatKey);
                      const isInDrag = activeDragKeys.has(localKey);

                      let cellClasses = "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]";
                      if (lockStatus === "confirmed") {
                        cellClasses = "border-[var(--color-border)] bg-[var(--color-muted-foreground)] text-[var(--color-background)]";
                      } else if (lockStatus === "pending_payment") {
                        cellClasses = "border-[var(--color-warning)] bg-[var(--color-warning)] text-[var(--color-foreground)]";
                      } else if (cell.hidden) {
                        cellClasses = "border-dashed border-[var(--color-border)] bg-transparent text-[var(--color-muted-foreground)]/40";
                      } else if (cell.staffReserved) {
                        cellClasses = "border-[var(--color-secondary)] bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]";
                      }

                      return (
                        <span key={localKey} className="contents">
                          {c === layout.aisleCol ? <span aria-hidden="true" /> : null}
                          <button
                            type="button"
                            aria-label={cell.seatLabel}
                            title={cell.seatLabel}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setStrokeBrush(resolveStrokeBrushForCell(localKey));
                              setDragStart({ r, c });
                              setDragCurrent({ r, c });
                            }}
                            onMouseEnter={() => {
                              if (dragStart) setDragCurrent({ r, c });
                            }}
                            className={`flex aspect-square w-full items-center justify-center rounded border text-[9px] font-bold transition sm:text-[10px] ${cellClasses} ${
                              isInDrag ? "ring-2 ring-[var(--color-foreground)]" : ""
                            }`}
                          >
                            {cell.hidden ? "·" : cell.seatNumber}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {stagePos === "bottom" ? stageBannerH : null}
          </div>
          {stagePos === "right" ? stageBannerV : null}
        </div>
      </div>
    </div>
  );
}
