import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/client/streamLongJobViaSse", () => ({
  streamLongJobViaSse: vi.fn(),
}));
vi.mock("@/lib/client/pollLongJob", () => ({
  pollLongJob: vi.fn(),
}));

import { useLongJobPoll } from "@/hooks/useLongJobPoll";
import { streamLongJobViaSse } from "@/lib/client/streamLongJobViaSse";
import { pollLongJob } from "@/lib/client/pollLongJob";

const snap = { status: "done" as const, current: 1, total: 1 };

describe("useLongJobPoll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(streamLongJobViaSse).mockResolvedValue(snap);
    vi.mocked(pollLongJob).mockResolvedValue(snap);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("polls when streamUrl is omitted", async () => {
    const { result } = renderHook(() => useLongJobPoll());
    await act(async () => {
      await result.current.pollUntilDone({
        jobId: "j1",
        pollUrl: (id) => `/api/jobs/${id}`,
        intervalMs: 5,
        maxTicks: 2,
        isTerminal: () => true,
        formatProgressLine: () => "line",
      });
    });
    expect(pollLongJob).toHaveBeenCalled();
    expect(streamLongJobViaSse).not.toHaveBeenCalled();
  });

  it("uses SSE when streamUrl is set and EventSource exists", async () => {
    vi.stubGlobal("EventSource", class {});
    const { result } = renderHook(() => useLongJobPoll());
    await act(async () => {
      await result.current.pollUntilDone({
        jobId: "j1",
        pollUrl: (id) => `/api/jobs/${id}`,
        streamUrl: (id) => `/sse/${id}`,
        intervalMs: 5,
        maxTicks: 2,
        isTerminal: () => true,
        formatProgressLine: () => null,
      });
    });
    expect(streamLongJobViaSse).toHaveBeenCalled();
  });

  it("falls back to polling when SSE throws", async () => {
    vi.stubGlobal("EventSource", class {});
    vi.mocked(streamLongJobViaSse).mockRejectedValueOnce(new Error("sse fail"));
    const { result } = renderHook(() => useLongJobPoll());
    await act(async () => {
      await result.current.pollUntilDone({
        jobId: "j1",
        pollUrl: (id) => `/api/jobs/${id}`,
        streamUrl: (id) => `/sse/${id}`,
        intervalMs: 5,
        maxTicks: 2,
        isTerminal: () => true,
        formatProgressLine: (s) => s.status,
      });
    });
    expect(streamLongJobViaSse).toHaveBeenCalled();
    expect(pollLongJob).toHaveBeenCalled();
  });

  it("reset clears live line and snapshot", async () => {
    const { result } = renderHook(() => useLongJobPoll());
    await act(async () => {
      await result.current.pollUntilDone({
        jobId: "j1",
        pollUrl: (id) => `/api/jobs/${id}`,
        intervalMs: 5,
        maxTicks: 1,
        isTerminal: () => true,
        formatProgressLine: () => "x",
      });
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.liveLine).toBeNull();
    expect(result.current.jobSnapshot).toBeNull();
  });
});
