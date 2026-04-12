import { LongJobStatus, type LongJobStatusProps } from "@/components/molecules/LongJobStatus";

export interface LongJobLoaderProps extends LongJobStatusProps {
  /** When a long-running job is in progress (spinner + `aria-busy`). */
  isRunning: boolean;
  /** Screen-reader-only text while `isRunning` (e.g. localized “Processing…”). */
  runningAriaLabel?: string;
}

/**
 * Standard loader for long-running jobs: spinner + {@link LongJobStatus}.
 * Use on every screen that runs long jobs (see `.cursor/rules/11-long-running-jobs-ui.mdc`).
 */
export function LongJobLoader({ isRunning, runningAriaLabel, ...status }: LongJobLoaderProps) {
  return (
    <div className="space-y-3" aria-busy={isRunning}>
      {isRunning ? (
        <div className="flex items-center gap-3" role="status">
          <span
            className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
            aria-hidden
          />
          {runningAriaLabel ? <span className="sr-only">{runningAriaLabel}</span> : null}
        </div>
      ) : null}
      <LongJobStatus {...status} />
    </div>
  );
}
