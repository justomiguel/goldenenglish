// REGRESSION CHECK: waitForSelector is the tour runner's DOM readiness gate.
import { afterEach, describe, expect, it, vi } from "vitest";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";

describe("waitForSelector", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("resolves when the element appears", async () => {
    vi.useFakeTimers();
    const p = waitForSelector("#appearing", { timeoutMs: 1000, intervalMs: 20 });
    setTimeout(() => {
      const el = document.createElement("div");
      el.id = "appearing";
      document.body.appendChild(el);
    }, 40);
    await vi.advanceTimersByTimeAsync(80);
    await expect(p).resolves.toBeTruthy();
  });

  it("returns null on timeout", async () => {
    vi.useFakeTimers();
    const p = waitForSelector("#missing", { timeoutMs: 100, intervalMs: 20 });
    await vi.advanceTimersByTimeAsync(150);
    await expect(p).resolves.toBeNull();
  });
});
