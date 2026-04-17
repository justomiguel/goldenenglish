"use client";

import { useCallback, useState } from "react";
import { pollLongJob, type PollLongJobParams } from "@/lib/client/pollLongJob";
import { streamLongJobViaSse } from "@/lib/client/streamLongJobViaSse";
import type { LongJobSnapshot } from "@/types/longJob";
import { logClientWarn } from "@/lib/logging/clientLog";

export type RunLongJobPollArgs = Omit<PollLongJobParams, "onTick"> & {
  formatProgressLine: (snapshot: LongJobSnapshot) => string | null;
  /** When set and the browser supports `EventSource`, use SSE; otherwise fall back to polling. */
  streamUrl?: (jobId: string) => string;
};

/**
 * Live progress line + latest snapshot (e.g. `activity` log) + poll until a terminal state.
 */
export function useLongJobPoll() {
  const [liveLine, setLiveLine] = useState<string | null>(null);
  const [jobSnapshot, setJobSnapshot] = useState<LongJobSnapshot | null>(null);

  const reset = useCallback(() => {
    setLiveLine(null);
    setJobSnapshot(null);
  }, []);

  const pollUntilDone = useCallback(async (args: RunLongJobPollArgs): Promise<LongJobSnapshot> => {
    const { formatProgressLine, streamUrl, ...rest } = args;
    const onTick = (snap: LongJobSnapshot) => {
      setJobSnapshot(snap);
      setLiveLine(formatProgressLine(snap));
    };

    if (streamUrl && typeof EventSource !== "undefined") {
      try {
        return await streamLongJobViaSse({
          jobId: rest.jobId,
          streamUrl,
          onTick,
          isTerminal: rest.isTerminal,
        });
      } catch {
        logClientWarn("useLongJobPoll:sse_fallback_to_poll");
      }
    }

    return pollLongJob({
      ...rest,
      onTick,
    });
  }, []);

  return { liveLine, jobSnapshot, reset, pollUntilDone };
}
