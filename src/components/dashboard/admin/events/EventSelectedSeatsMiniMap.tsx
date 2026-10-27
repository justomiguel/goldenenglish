import { TheaterSeatIcon } from "@/components/atoms/TheaterSeatIcon";
import {
  buildSelectedSeatPreview,
  type SelectedSeatPreviewBlock,
} from "@/lib/events/selectedSeatPreview";
import type { EventSeatMapConfig } from "@/lib/events/seatMapModel";

interface EventSelectedSeatsMiniMapProps {
  config: EventSeatMapConfig | null;
  seatLabels: string[];
  label: string;
}

function SeatCluster({ block }: { block: SelectedSeatPreviewBlock }) {
  const rowLabels = new Map<number, string>();
  for (const cell of block.cells) {
    if (!rowLabels.has(cell.gridRow)) rowLabels.set(cell.gridRow, cell.rowLabel);
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
      {block.stageLabel ? (
        <p className="mx-auto mb-2 w-fit rounded-md bg-[var(--color-foreground)] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[var(--color-background)]">
          {block.stageLabel}
        </p>
      ) : null}
      <div
        className="mx-auto grid w-fit items-center justify-items-center gap-1"
        style={{
          gridTemplateColumns: `1.25rem repeat(${block.colCount}, 1.75rem)`,
          gridTemplateRows: `repeat(${block.rowCount}, 1.75rem)`,
        }}
      >
        {[...rowLabels.entries()].map(([gridRow, rowLabel]) => (
          <span
            key={`row-${gridRow}`}
            className="text-[10px] font-semibold text-[var(--color-muted-foreground)]"
            style={{ gridRow, gridColumn: 1 }}
          >
            {rowLabel}
          </span>
        ))}
        {block.cells.map((cell) => (
          <span
            key={cell.seatLabel}
            title={cell.seatLabel}
            aria-label={cell.seatLabel}
            className="text-[var(--color-primary)]"
            style={{ gridRow: cell.gridRow, gridColumn: cell.gridCol + 1 }}
          >
            <TheaterSeatIcon seatNumber={cell.seatNumber} className="h-6 w-6" />
          </span>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-[var(--color-muted-foreground)]">
        {[block.floorName, block.blockLabel].filter(Boolean).join(" · ")}
      </p>
    </div>
  );
}

export function EventSelectedSeatsMiniMap({
  config,
  seatLabels,
  label,
}: EventSelectedSeatsMiniMapProps) {
  const blocks = buildSelectedSeatPreview(config, seatLabels);

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      {blocks.length === 0 ? (
        <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">{seatLabels.join(", ")}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-3">
          {blocks.map((block) => (
            <SeatCluster key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}
