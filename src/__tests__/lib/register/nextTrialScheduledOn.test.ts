/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { nextTrialScheduledOn } from "@/lib/register/nextTrialScheduledOn";

const TZ = "America/Argentina/Cordoba";

describe("nextTrialScheduledOn", () => {
  it("returns today when the slot has not started yet in the institute zone", () => {
    // Wednesday 2026-04-15 10:00 in Cordoba (UTC-3) = 13:00 UTC
    const now = new Date(Date.UTC(2026, 3, 15, 13, 0, 0));
    expect(nextTrialScheduledOn(now, 3, "18:00", TZ)).toBe("2026-04-15");
  });

  it("returns next week when today's slot already started", () => {
    const now = new Date(Date.UTC(2026, 3, 15, 22, 0, 0));
    expect(nextTrialScheduledOn(now, 3, "18:00", TZ)).toBe("2026-04-22");
  });

  it("returns the next matching weekday when today is a different day", () => {
    // Thursday 2026-04-16 12:00 Cordoba
    const now = new Date(Date.UTC(2026, 3, 16, 15, 0, 0));
    expect(nextTrialScheduledOn(now, 1, "18:00", TZ)).toBe("2026-04-20");
  });
});
