import type { LongJobSnapshot } from "@/types/longJob";

export type PollLongJobParams = {
  jobId: string;
  /** Absolute or same-origin URL builder, e.g. `(id) => \`/api/admin/import/jobs/\${id}\``. */
  pollUrl: (jobId: string) => string;
  onTick: (snapshot: LongJobSnapshot) => void;
  /** Delay between GET polls (ms). */
  intervalMs?: number;
  /** Max poll iterations to avoid infinite loops. */
  maxTicks?: number;
  /** Stops the loop when the caller no longer needs ticks. */
  signal?: AbortSignal;
  isTerminal: (snapshot: LongJobSnapshot) => boolean;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new Error("aborted"));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * HTTP polling until `isTerminal` is true or `maxTicks` is reached.
 * No React dependency: safe from hooks or plain callbacks.
 */
export async function pollLongJob({
  jobId,
  pollUrl,
  onTick,
  intervalMs = 450,
  maxTicks = 5000,
  signal,
  isTerminal,
}: PollLongJobParams): Promise<LongJobSnapshot> {
  for (let i = 0; i < maxTicks; i++) {
    if (signal?.aborted) throw new Error("aborted");
    const res = await fetch(pollUrl(jobId));
    if (signal?.aborted) throw new Error("aborted");
    if (res.status === 401 || res.status === 403) {
      throw new Error("unauthorized");
    }
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const snapshot = (await res.json()) as LongJobSnapshot;
    onTick(snapshot);
    if (isTerminal(snapshot)) {
      return snapshot;
    }
    await sleep(intervalMs, signal);
  }
  throw new Error("timeout");
}
