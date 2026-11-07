"use client";

import { useState } from "react";
import { Layers, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { TheaterSeatIcon } from "@/components/atoms/TheaterSeatIcon";
import {
  buildResponsiveSeatGridLayout,
  resolveStagePosition,
} from "@/lib/events/seatMapMatrixPainter";
import { generateFloorCells, type EventSeatMapConfig } from "@/lib/events/seatMapModel";
import { decideSeatToggle } from "@/lib/events/decideSeatToggle";
import {
  resolveFloorSeatsWithState,
  type EventSeatLockSnapshot,
  type EventSeatVisualState,
} from "@/lib/events/seatMapState";
import { seatStateLabel, seatToneClasses } from "@/components/organisms/eventSeatPickerChrome";

export interface EventRegisterSeatPickerLabels {
  title: string;
  lead: string;
  floorTabsAria: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  selectedCount: string;
  legendFree: string;
  legendReserved: string;
  legendPending: string;
  legendPurchased: string;
  legendHeld: string;
  legendSelected: string;
  seatAriaTemplate: string;
  seatCountMismatch: string;
  seatAlreadyTaken: string;
  invalidSeat: string;
  lostSeatsNotice: string;
  useSuggestedSeats: string;
  chooseAnotherSeat: string;
  holdCountdown: string;
  holdExpired: string;
  holdFailed: string;
}

interface EventRegisterSeatPickerProps {
  config: EventSeatMapConfig;
  locks: readonly EventSeatLockSnapshot[];
  heldByOthers?: readonly string[];
  lostSeatKeys?: readonly string[];
  requiredSeatCount: number;
  selectedSeatKeys: readonly string[];
  onSelectedSeatKeysChange: (next: string[]) => void;
  onBeforeSelect?: (seatKey: string) => Promise<boolean>;
  onSeatRefused?: (seatKey: string) => void;
  labels: EventRegisterSeatPickerLabels;
}

export function EventRegisterSeatPicker({
  config,
  locks,
  heldByOthers = [],
  lostSeatKeys = [],
  requiredSeatCount,
  selectedSeatKeys,
  onSelectedSeatKeysChange,
  onBeforeSelect,
  onSeatRefused,
  labels,
}: EventRegisterSeatPickerProps) {
  const [activeFloorId, setActiveFloorId] = useState<string | null>(config.floors[0]?.id ?? null);
  const [zoom, setZoom] = useState(1);

  const activeFloor = config.floors.find((floor) => floor.id === activeFloorId) ?? config.floors[0] ?? null;
  if (!activeFloor) return null;

  const selectedSet = new Set(selectedSeatKeys);
  const stateBySeatKey = new Map<string, EventSeatVisualState>();
  const labelByKey = new Map<string, string>();
  for (const floor of config.floors) {
    for (const seat of resolveFloorSeatsWithState(floor, locks, heldByOthers)) {
      stateBySeatKey.set(seat.seatKey, seat.state);
      labelByKey.set(seat.seatKey, seat.seatLabel);
    }
  }

  function toggleSeat(seatKey: string) {
    const state = stateBySeatKey.get(seatKey) ?? "free";
    const decision = decideSeatToggle({
      seatKey,
      state,
      selectedSeatKeys,
      requiredCount: requiredSeatCount,
    });
    if (decision.action === "refuse") {
      onSeatRefused?.(decision.seatKey);
      return;
    }
    if (decision.action === "remove" || !onBeforeSelect) {
      onSelectedSeatKeysChange(decision.next);
      return;
    }
    void onBeforeSelect(seatKey).then((ok) => {
      if (ok) onSelectedSeatKeysChange(decision.next);
    });
  }

  const countText = labels.selectedCount
    .replace("{selected}", String(selectedSeatKeys.length))
    .replace("{required}", String(requiredSeatCount));

  const stagePos = resolveStagePosition(activeFloor.stage);
  const stageBannerH = (
    <div className="w-full px-4 sm:px-8">
      <div className="mx-auto w-full max-w-md rounded-2xl border-2 border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-1.5 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--color-foreground)] shadow-sm sm:text-xs">
        {activeFloor.stage.label}
      </div>
    </div>
  );
  const stageBannerV = (
    <div className="flex min-w-8 items-center justify-center rounded-2xl border-2 border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-1.5 py-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--color-foreground)] shadow-sm [writing-mode:vertical-rl] sm:min-w-10 sm:px-2 sm:text-xs">
      {activeFloor.stage.label}
    </div>
  );

  return (
    <section id="event-seat-map" className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">{labels.title}</h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" aria-label={labels.zoomOut} title={labels.zoomOut} onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}>
            <ZoomOut className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="ghost" aria-label={labels.zoomReset} title={labels.zoomReset} onClick={() => setZoom(1)}>
            <RotateCcw className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="ghost" aria-label={labels.zoomIn} title={labels.zoomIn} onClick={() => setZoom((z) => Math.min(2, Number((z + 0.25).toFixed(2))))}>
            <ZoomIn className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      {config.floors.length > 1 ? (
        <div role="tablist" aria-label={labels.floorTabsAria} className="flex flex-wrap gap-2">
          {config.floors.map((floor) => (
            <Button key={floor.id} type="button" variant={floor.id === activeFloor.id ? "primary" : "ghost"} onClick={() => setActiveFloorId(floor.id)}>
              <Layers className="h-4 w-4" aria-hidden />
              {floor.name}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-foreground)] sm:gap-4">
        <span className="inline-flex items-center gap-1.5"><TheaterSeatIcon className="h-4 w-4 text-[var(--color-primary)]" />{labels.legendFree}</span>
        <span className="inline-flex items-center gap-1.5"><TheaterSeatIcon className="h-4 w-4 text-[var(--color-secondary)] ring-1 ring-[var(--color-foreground)] rounded-xs" />{labels.legendSelected}</span>
        <span className="inline-flex items-center gap-1.5"><TheaterSeatIcon className="h-4 w-4 text-[var(--color-secondary)]/55" />{labels.legendReserved}</span>
        <span className="inline-flex items-center gap-1.5"><TheaterSeatIcon className="h-4 w-4 text-[var(--color-warning)]" />{labels.legendPending}</span>
        <span className="inline-flex items-center gap-1.5"><TheaterSeatIcon className="h-4 w-4 text-[var(--color-muted-foreground)]" />{labels.legendHeld}</span>
        <span className="inline-flex items-center gap-1.5"><TheaterSeatIcon crossed className="h-4 w-4 text-[var(--color-muted-foreground)]/45" />{labels.legendPurchased}</span>
      </div>

      <div
        data-seat-map-viewport={zoom === 1 ? "fit" : "zoomed"}
        className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2 sm:p-4 ${zoom === 1 ? "overflow-hidden" : "overflow-auto"}`}
      >
        <div style={{ width: `${zoom * 100}%` }} className="mx-auto flex items-stretch justify-center gap-2 sm:gap-4">
          {stagePos === "left" ? stageBannerV : null}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5 sm:gap-3.5">
            {stagePos === "top" ? stageBannerH : null}

            {activeFloor.blocks.map((block) => {
              const cells = generateFloorCells({ ...activeFloor, blocks: [block] });
              const cellByLocal = new Map(cells.map((c) => [c.localKey, c]));
              const layout = buildResponsiveSeatGridLayout(block, { includeRightLabel: true });

              return (
                <div key={block.id} style={{ maxWidth: zoom === 1 ? layout.maxWidthCss : undefined }} className="w-full space-y-0.5 sm:space-y-1">
                  {Array.from({ length: block.rows }, (_, r) => {
                    const rowLabel = cellByLocal.get(`${r}:0`)?.rowLabel ?? String(r + 1);
                    return (
                      <div key={`row-${r}`} style={{ gridTemplateColumns: layout.gridTemplateColumns }} className="grid w-full items-center gap-0.5 sm:gap-1">
                        <span className="flex items-center justify-center text-[10px] font-bold text-[var(--color-muted-foreground)] sm:text-xs">{rowLabel}</span>
                        {Array.from({ length: block.cols }, (_, c) => {
                          const cell = cellByLocal.get(`${r}:${c}`);
                          const aisleNode = c === layout.aisleCol ? <span key={`aisle-${r}-${c}`} aria-hidden="true" className="aspect-square w-full" /> : null;
                          if (!cell || cell.hidden) {
                            return (
                              <span key={`cell-${r}-${c}`} className="contents">
                                {aisleNode}
                                <span data-seat-spacer="true" aria-hidden="true" className="aspect-square w-full" />
                              </span>
                            );
                          }
                          const state = stateBySeatKey.get(cell.seatKey) ?? "free";
                          const isSelected = selectedSet.has(cell.seatKey);
                          const isLost = lostSeatKeys.includes(cell.seatKey);
                          const ariaLabel = labels.seatAriaTemplate
                            .replace("{label}", cell.seatLabel)
                            .replace("{state}", isSelected ? labels.legendSelected : seatStateLabel(state, labels));

                          return (
                            <span key={cell.seatKey} className="contents">
                              {aisleNode}
                              <button
                                type="button"
                                disabled={state !== "free" && !isSelected}
                                aria-label={ariaLabel}
                                aria-pressed={isSelected}
                                title={ariaLabel}
                                onClick={() => toggleSeat(cell.seatKey)}
                                className={`flex aspect-square w-full items-center justify-center transition ${seatToneClasses(state, isSelected)} ${isLost ? "ring-2 ring-[var(--color-error)] rounded-md" : ""}`}
                              >
                                <TheaterSeatIcon seatNumber={cell.seatNumber} crossed={state === "purchased"} className="h-full w-full" />
                              </button>
                            </span>
                          );
                        })}
                        <span className="flex items-center justify-center text-[10px] font-bold text-[var(--color-muted-foreground)] sm:text-xs">{rowLabel}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {stagePos === "bottom" ? stageBannerH : null}
          </div>
          {stagePos === "right" ? stageBannerV : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-foreground)]">
        <span className="font-medium">{countText}</span>
        <div className="flex flex-wrap gap-1.5">
          {selectedSeatKeys.map((key) => (
            <span key={key} className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-foreground)]">
              {labelByKey.get(key) ?? key}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
