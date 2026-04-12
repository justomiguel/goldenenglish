/**
 * Text / `<pre>` block for long-running jobs (progress, result, errors).
 * When a spinner or busy state is shown, compose with {@link LongJobLoader} (rule `11-long-running-jobs-ui.mdc`).
 */
export interface LongJobStatusProps {
  /** Line that updates while the job runs (e.g. “Row 3 of 100”). */
  progressLine: string | null;
  /** Final success or neutral status message (not an error). */
  statusMessage: string | null;
  /** Error body or technical detail (e.g. monospace `<pre>`). */
  errorDetail: string | null;
  /** When true, show the detail block without error styling (e.g. failed import rows). */
  detailIsErrorTone?: boolean;
}

export function LongJobStatus({
  progressLine,
  statusMessage,
  errorDetail,
  detailIsErrorTone = true,
}: LongJobStatusProps) {
  const detailClass = detailIsErrorTone
    ? "text-[var(--color-error)]"
    : "text-[var(--color-foreground)]";

  return (
    <div className="space-y-3">
      {progressLine ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
          {progressLine}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="text-sm text-[var(--color-foreground)]" role="status">
          {statusMessage}
        </p>
      ) : null}
      {errorDetail ? (
        <pre
          className={`max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-xs ${detailClass}`}
        >
          {errorDetail}
        </pre>
      ) : null}
    </div>
  );
}
