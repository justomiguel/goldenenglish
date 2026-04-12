import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scheduleIdle } from "@/lib/analytics/scheduleIdle";

describe("scheduleIdle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs via setTimeout when requestIdleCallback is missing", () => {
    const w = window as Window & { requestIdleCallback?: unknown };
    const orig = w.requestIdleCallback;
    delete w.requestIdleCallback;
    const fn = vi.fn();
    scheduleIdle(fn);
    expect(fn).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
    w.requestIdleCallback = orig;
  });

  it("runs via requestIdleCallback when available", () => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number };
    const orig = w.requestIdleCallback;
    const fn = vi.fn();
    w.requestIdleCallback = (cb) => {
      cb();
      return 0;
    };
    scheduleIdle(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    w.requestIdleCallback = orig;
  });
});
