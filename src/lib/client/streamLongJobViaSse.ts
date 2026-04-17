import { logClientException, logClientWarn } from "@/lib/logging/clientLog";
import type { LongJobSnapshot } from "@/types/longJob";

export type StreamLongJobParams = {
  jobId: string;
  streamUrl: (jobId: string) => string;
  onTick: (snapshot: LongJobSnapshot) => void;
  isTerminal: (snapshot: LongJobSnapshot) => boolean;
  signal?: AbortSignal;
};

/**
 * Follow a long-running job via Server-Sent Events (`data: {json}\n\n`).
 * Snapshot shape matches the JSON from the polling `GET` (e.g. admin import jobs).
 */
export function streamLongJobViaSse(params: StreamLongJobParams): Promise<LongJobSnapshot> {
  return new Promise((resolve, reject) => {
    if (typeof EventSource === "undefined") {
      reject(new Error("event_source_unsupported"));
      return;
    }

    let settled = false;
    let last: LongJobSnapshot | null = null;
    const es = new EventSource(params.streamUrl(params.jobId));

    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      es.close();
      action();
    };

    es.onmessage = (ev) => {
      try {
        const snap = JSON.parse(ev.data) as LongJobSnapshot;
        last = snap;
        params.onTick(snap);
        if (params.isTerminal(snap)) {
          finish(() => resolve(snap));
        }
      } catch (err) {
        logClientException("streamLongJobViaSse:onmessage", err, { jobId: params.jobId });
        finish(() => reject(err instanceof Error ? err : new Error(String(err))));
      }
    };

    es.onerror = () => {
      logClientWarn("streamLongJobViaSse:onerror", {
        jobId: params.jobId,
        hadLastTerminal: Boolean(last && params.isTerminal(last)),
      });
      finish(() => {
        if (last && params.isTerminal(last)) {
          resolve(last);
          return;
        }
        reject(new Error("sse_connection_error"));
      });
    };

    const onAbort = () => finish(() => reject(new Error("aborted")));
    params.signal?.addEventListener("abort", onAbort, { once: true });
  });
}
