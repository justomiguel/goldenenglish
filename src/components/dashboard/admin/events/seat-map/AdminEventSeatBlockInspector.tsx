"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { resolveBlockAisleCol, type EventSeatBlock } from "@/lib/events/seatMapModel";
import type { Dictionary } from "@/types/i18n";

export type AdminEventSeatMapLabels = Dictionary["admin"]["events"]["seatMap"];

interface AdminEventSeatBlockInspectorProps {
  block: EventSeatBlock;
  disabled?: boolean;
  labels: AdminEventSeatMapLabels;
  onChange: (partial: Partial<EventSeatBlock>) => void;
}

function clampInt(raw: string, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function AdminEventSeatBlockInspector({
  block,
  disabled,
  labels,
  onChange,
}: AdminEventSeatBlockInspectorProps) {
  const maxAisleCol = Math.max(1, block.cols - 1);
  const currentAisleCol = resolveBlockAisleCol(block);
  const effectiveAisleCol = currentAisleCol > 0 ? currentAisleCol : Math.floor(block.cols / 2);

  return (
    <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4">
      <div>
        <h4 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.step1Title}</h4>
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.step1Hint}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor={`seat-block-rows-${block.id}`}>{labels.rowsLabel}</Label>
          <Input
            id={`seat-block-rows-${block.id}`}
            type="number"
            min={1}
            max={100}
            value={String(block.rows)}
            disabled={disabled}
            onChange={(event) =>
              onChange({ rows: clampInt(event.target.value, 1, 100, block.rows) })
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`seat-block-cols-${block.id}`}>{labels.colsLabel}</Label>
          <Input
            id={`seat-block-cols-${block.id}`}
            type="number"
            min={1}
            max={100}
            value={String(block.cols)}
            disabled={disabled}
            onChange={(event) =>
              onChange({ cols: clampInt(event.target.value, 1, 100, block.cols) })
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`seat-block-start-row-${block.id}`}>{labels.startRowLabel}</Label>
          <Input
            id={`seat-block-start-row-${block.id}`}
            value={block.startRowLabel}
            disabled={disabled}
            onChange={(event) =>
              onChange({ startRowLabel: event.target.value.slice(0, 8) || "A" })
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`seat-block-start-num-${block.id}`}>{labels.startSeatNumberLabel}</Label>
          <Input
            id={`seat-block-start-num-${block.id}`}
            type="number"
            min={1}
            max={999}
            value={String(block.startSeatNumber)}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                startSeatNumber: clampInt(event.target.value, 1, 999, block.startSeatNumber),
              })
            }
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={block.splitIntoTwo}
            disabled={disabled}
            onChange={(event) => onChange({ splitIntoTwo: event.target.checked })}
          />
          {labels.splitIntoTwoLabel}
        </label>

        {block.splitIntoTwo && block.cols >= 2 ? (
          <div className="flex items-center gap-2">
            <Label htmlFor={`seat-block-aisle-col-${block.id}`}>{labels.aisleAfterColLabel}</Label>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled || effectiveAisleCol <= 1}
              aria-label="←"
              title="←"
              onClick={() =>
                onChange({ aisleAfterCol: Math.max(1, effectiveAisleCol - 1) })
              }
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Input
              id={`seat-block-aisle-col-${block.id}`}
              type="number"
              min={1}
              max={maxAisleCol}
              value={String(effectiveAisleCol)}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  aisleAfterCol: clampInt(event.target.value, 1, maxAisleCol, effectiveAisleCol),
                })
              }
              className="w-20 text-center"
            />
            <Button
              type="button"
              variant="ghost"
              disabled={disabled || effectiveAisleCol >= maxAisleCol}
              aria-label="→"
              title="→"
              onClick={() =>
                onChange({ aisleAfterCol: Math.min(maxAisleCol, effectiveAisleCol + 1) })
              }
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
