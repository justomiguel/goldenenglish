import { describe, it, expect, vi, beforeEach } from "vitest";
import { pollLongJob } from "@/lib/client/pollLongJob";

describe("pollLongJob", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "",
        json: async () => ({ status: "done", current: 1, total: 1 }),
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns last snapshot when isTerminal is true on first response", async () => {
    const onTick = vi.fn();
    const snap = await pollLongJob({
      jobId: "j1",
      pollUrl: (id) => `/api/jobs/${id}`,
      onTick,
      intervalMs: 10,
      maxTicks: 5,
      isTerminal: (s) => s.status === "done",
    });
    expect(snap.status).toBe("done");
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/jobs/j1");
  });

  it.each([401, 403] as const)("throws unauthorized on %s", async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status,
        text: async () => "",
      }),
    );
    await expect(
      pollLongJob({
        jobId: "j1",
        pollUrl: () => "/x",
        onTick: vi.fn(),
        intervalMs: 1,
        maxTicks: 2,
        isTerminal: () => false,
      }),
    ).rejects.toThrow("unauthorized");
  });

  it("throws with response body when not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "boom",
      }),
    );
    await expect(
      pollLongJob({
        jobId: "j1",
        pollUrl: () => "/x",
        onTick: vi.fn(),
        intervalMs: 1,
        maxTicks: 2,
        isTerminal: () => false,
      }),
    ).rejects.toThrow("boom");
  });

  it("throws timeout when maxTicks exhausted without terminal", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "",
        json: async () => ({ status: "running", current: 1, total: 2 }),
      }),
    );
    const p = pollLongJob({
      jobId: "j1",
      pollUrl: () => "/x",
      onTick: vi.fn(),
      intervalMs: 5,
      maxTicks: 2,
      isTerminal: () => false,
    });
    const assertion = expect(p).rejects.toThrow("timeout");
    await vi.runAllTimersAsync();
    await assertion;
  });

  it("polls until terminal", async () => {
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        n += 1;
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => "",
          json: async () =>
            n >= 2
              ? { status: "done", current: 2, total: 2 }
              : { status: "running", current: 1, total: 2 },
        });
      }),
    );
    const onTick = vi.fn();
    const snap = await pollLongJob({
      jobId: "x",
      pollUrl: () => "/x",
      onTick,
      intervalMs: 5,
      maxTicks: 10,
      isTerminal: (s) => s.status === "done",
    });
    expect(snap.status).toBe("done");
    expect(onTick).toHaveBeenCalledTimes(2);
  });
});
