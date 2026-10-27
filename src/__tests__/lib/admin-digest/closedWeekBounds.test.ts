import { describe, expect, it } from "vitest";
import { closedWeekBounds } from "@/lib/admin-digest/closedWeekBounds";

describe("closedWeekBounds", () => {
  it("closes the previous Monday through Sunday for a Monday morning in Córdoba", () => {
    const now = new Date("2026-10-26T12:00:00.000Z");
    const bounds = closedWeekBounds(now, "America/Argentina/Cordoba");
    expect(bounds.weekStartDate).toBe("2026-10-19");
    expect(bounds.weekStart.toISOString()).toBe("2026-10-19T03:00:00.000Z");
    expect(bounds.weekEnd.toISOString()).toBe("2026-10-26T02:59:59.999Z");
    expect(bounds.priorWeekStartDate).toBe("2026-10-12");
    expect(bounds.monthStart).toBe("2026-10-01");
    expect(bounds.monthEnd).toBe("2026-10-31");
  });

  it("steps back a full week when the local day is Sunday", () => {
    const now = new Date("2026-10-25T15:00:00.000Z");
    const bounds = closedWeekBounds(now, "America/Argentina/Cordoba");
    expect(bounds.weekStartDate).toBe("2026-10-12");
    expect(bounds.priorWeekStartDate).toBe("2026-10-05");
  });
});
