"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { saveEventSeatMapConfigAction } from "@/app/[locale]/dashboard/admin/events/eventSeatMapActions";
import {
  applySeatBrushToBlock,
  applyStagePositionToFloor,
  createDefaultFloorWithMatrix,
  ensureFloorHasMatrixBlock,
  type SeatPaintBrush,
} from "@/lib/events/seatMapMatrixPainter";
import {
  countEventSeatMapCapacity,
  type EventSeatFloor,
  type EventSeatMapConfig,
} from "@/lib/events/seatMapModel";
import type { EventSeatLockSnapshot } from "@/lib/events/seatMapState";
import {
  AdminEventSeatBlockInspector,
  type AdminEventSeatMapLabels,
} from "@/components/dashboard/admin/events/seat-map/AdminEventSeatBlockInspector";
import { AdminEventSeatFloorHeader } from "@/components/dashboard/admin/events/seat-map/AdminEventSeatFloorHeader";
import { AdminEventSeatMapCanvas } from "@/components/dashboard/admin/events/seat-map/AdminEventSeatMapCanvas";

interface AdminEventSeatMapPanelProps {
  locale: string;
  eventId: string;
  initialConfig: EventSeatMapConfig;
  seatLocks: readonly EventSeatLockSnapshot[];
  labels: AdminEventSeatMapLabels;
}

export function AdminEventSeatMapPanel({
  locale,
  eventId,
  initialConfig,
  seatLocks,
  labels,
}: AdminEventSeatMapPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [config, setConfig] = useState<EventSeatMapConfig>(() => ({
    ...initialConfig,
    floors: initialConfig.floors.map(ensureFloorHasMatrixBlock),
  }));
  const [activeFloorId, setActiveFloorId] = useState<string | null>(
    initialConfig.floors[0]?.id ?? null,
  );
  const [syncCapacity, setSyncCapacity] = useState(true);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const activeFloor =
    config.floors.find((f) => f.id === activeFloorId) ?? config.floors[0] ?? null;
  const matrixBlock = activeFloor?.blocks[0] ?? null;
  const counts = countEventSeatMapCapacity(config);

  function updateFloor(floorId: string, updater: (floor: EventSeatFloor) => EventSeatFloor) {
    setConfig((prev) => ({
      ...prev,
      floors: prev.floors.map((floor) => (floor.id === floorId ? updater(floor) : floor)),
    }));
  }

  function handleToggleEnabled(checked: boolean) {
    setConfig((prev) => {
      if (checked && prev.floors.length === 0) {
        const firstFloor = createDefaultFloorWithMatrix(0, "Platea Baja");
        setActiveFloorId(firstFloor.id);
        return { enabled: true, floors: [firstFloor] };
      }
      return { ...prev, enabled: checked };
    });
  }

  function handlePaintCells(localKeys: string[], brush: SeatPaintBrush) {
    if (!activeFloor || !matrixBlock) return;
    const updated = applySeatBrushToBlock(matrixBlock, localKeys, brush);
    updateFloor(activeFloor.id, (floor) => ({ ...floor, blocks: [updated] }));
  }

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveEventSeatMapConfigAction({
        locale,
        eventId,
        seatMapConfig: config,
        syncCapacity,
      });
      if (!result.ok) {
        setFeedback({ ok: false, text: labels.errorSave });
        return;
      }
      setFeedback({ ok: true, text: labels.savedOk });
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">{labels.title}</h3>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
        <input
          type="checkbox"
          checked={config.enabled}
          disabled={pending}
          onChange={(event) => handleToggleEnabled(event.target.checked)}
        />
        {labels.enabledLabel}
      </label>

      {config.enabled ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {config.floors.map((floor) => (
              <Button
                key={floor.id}
                type="button"
                variant={floor.id === activeFloor?.id ? "primary" : "ghost"}
                onClick={() => setActiveFloorId(floor.id)}
              >
                <Layers className="h-4 w-4" aria-hidden />
                {floor.name}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const floor = createDefaultFloorWithMatrix(config.floors.length);
                setConfig((prev) => ({ ...prev, floors: [...prev.floors, floor] }));
                setActiveFloorId(floor.id);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {labels.addFloor}
            </Button>
          </div>

          {activeFloor && matrixBlock ? (
            <div className="space-y-4">
              <AdminEventSeatFloorHeader
                floor={activeFloor}
                canRemoveFloor={config.floors.length > 1}
                labels={labels}
                onFloorNameChange={(name) => updateFloor(activeFloor.id, (f) => ({ ...f, name }))}
                onStageLabelChange={(stageLabel) =>
                  updateFloor(activeFloor.id, (f) => ({ ...f, stage: { ...f.stage, label: stageLabel } }))
                }
                onStagePositionChange={(position) =>
                  updateFloor(activeFloor.id, (f) => applyStagePositionToFloor(f, position))
                }
                onRemoveFloor={() => {
                  const remaining = config.floors.filter((f) => f.id !== activeFloor.id);
                  setConfig((prev) => ({ ...prev, floors: remaining }));
                  setActiveFloorId(remaining[0]?.id ?? null);
                }}
              />
              <AdminEventSeatBlockInspector
                block={matrixBlock}
                disabled={pending}
                labels={labels}
                onChange={(partial) =>
                  updateFloor(activeFloor.id, (f) => ({
                    ...f,
                    blocks: [{ ...matrixBlock, ...partial }],
                  }))
                }
              />
              <AdminEventSeatMapCanvas
                floor={activeFloor}
                block={matrixBlock}
                seatLocks={seatLocks}
                labels={labels}
                onPaintCells={handlePaintCells}
                onResetAllAvailable={() =>
                  updateFloor(activeFloor.id, (f) => ({
                    ...f,
                    blocks: [{ ...matrixBlock, hiddenSeats: [], reservedSeats: [] }],
                  }))
                }
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3 text-sm text-[var(--color-foreground)]">
            <div className="flex flex-wrap gap-4">
              <span>{labels.statsTotalVisible}: <strong>{counts.totalVisibleSeats}</strong></span>
              <span>{labels.statsReserved}: <strong>{counts.staffReservedSeats}</strong></span>
              <span>{labels.statsPurchasable}: <strong>{counts.purchasableSeats}</strong></span>
            </div>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={syncCapacity} onChange={(e) => setSyncCapacity(e.target.checked)} />
              {labels.syncCapacityLabel}
            </label>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p role={feedback.ok ? "status" : "alert"} className={`text-sm ${feedback.ok ? "text-[var(--color-foreground)]" : "text-[var(--color-error)]"}`}>{feedback.text}</p>
      ) : null}

      <Button type="button" onClick={handleSave} isLoading={pending}>
        <Save className="h-4 w-4" aria-hidden />
        {labels.save}
      </Button>
    </section>
  );
}
