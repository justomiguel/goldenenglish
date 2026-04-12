interface EngagementBarProps {
  points: number;
  title: string;
  hint: string;
}

const DISPLAY_CAP = 100;

export function EngagementBar({ points, title, hint }: EngagementBarProps) {
  const pct = Math.min(100, Math.round((Math.min(points, DISPLAY_CAP) / DISPLAY_CAP) * 100));

  return (
    <section
      className="mb-8 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      aria-labelledby="engagement-title"
    >
      <h2 id="engagement-title" className="font-semibold text-[var(--color-primary)]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{hint}</p>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={title}
        >
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-medium tabular-nums text-[var(--color-foreground)]">
          {Math.min(points, DISPLAY_CAP)}/{DISPLAY_CAP}
        </span>
      </div>
    </section>
  );
}
