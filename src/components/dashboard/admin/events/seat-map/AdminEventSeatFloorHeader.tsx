"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { resolveStagePosition } from "@/lib/events/seatMapMatrixPainter";
import type { EventSeatFloor, EventSeatStagePosition } from "@/lib/events/seatMapModel";
import type { AdminEventSeatMapLabels } from "@/components/dashboard/admin/events/seat-map/AdminEventSeatBlockInspector";

interface AdminEventSeatFloorHeaderProps {
  floor: EventSeatFloor;
  canRemoveFloor: boolean;
  labels: AdminEventSeatMapLabels;
  onFloorNameChange: (name: string) => void;
  onStageLabelChange: (stageLabel: string) => void;
  onStagePositionChange: (position: EventSeatStagePosition) => void;
  onRemoveFloor: () => void;
}

export function AdminEventSeatFloorHeader({
  floor,
  canRemoveFloor,
  labels,
  onFloorNameChange,
  onStageLabelChange,
  onStagePositionChange,
  onRemoveFloor,
}: AdminEventSeatFloorHeaderProps) {
  const stagePosition = resolveStagePosition(floor.stage);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <Label htmlFor="seat-floor-name">{labels.floorNameLabel}</Label>
        <Input
          id="seat-floor-name"
          value={floor.name}
          onChange={(event) => onFloorNameChange(event.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="seat-stage-label">{labels.stageLabelLabel}</Label>
        <Input
          id="seat-stage-label"
          value={floor.stage.label}
          onChange={(event) => onStageLabelChange(event.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="seat-stage-position">{labels.stagePositionLabel}</Label>
        <select
          id="seat-stage-position"
          value={stagePosition}
          onChange={(event) =>
            onStagePositionChange(event.target.value as EventSeatStagePosition)
          }
          className="mt-1 min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] md:min-h-9"
        >
          <option value="top">{labels.stagePositionTop}</option>
          <option value="bottom">{labels.stagePositionBottom}</option>
          <option value="left">{labels.stagePositionLeft}</option>
          <option value="right">{labels.stagePositionRight}</option>
        </select>
      </div>
      {canRemoveFloor ? (
        <div className="flex flex-wrap items-end">
          <Button type="button" variant="ghost" onClick={onRemoveFloor}>
            <Trash2 className="h-4 w-4" aria-hidden />
            {labels.removeFloor}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
