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
  isTerminal: (snapshot: LongJobSnapshot) => boolean;
};

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
  isTerminal,
}: PollLongJobParams): Promise<LongJobSnapshot> {
  for (let i = 0; i < maxTicks; i++) {
    const res = await fetch(pollUrl(jobId));
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
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("timeout");
}
