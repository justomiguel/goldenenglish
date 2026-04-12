/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest";
import { scheduleIdle } from "@/lib/analytics/scheduleIdle";

describe("scheduleIdle (node)", () => {
  it("no-ops when window is undefined", () => {
    const fn = vi.fn();
    scheduleIdle(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});
