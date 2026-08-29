import { afterEach, describe, expect, it, vi } from "vitest";
import { formatParentLastAccess } from "@/lib/parents/formatParentLastAccess";

describe("formatParentLastAccess", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the never label for missing or invalid dates", () => {
    expect(formatParentLastAccess(null, "es", "Nunca")).toBe("Nunca");
    expect(formatParentLastAccess("not-a-date", "es", "Nunca")).toBe("Nunca");
  });

  it("uses relative units up to 45 days and a calendar date after that", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-31T12:00:00.000Z"));
    expect(formatParentLastAccess("2026-08-31T11:59:30.000Z", "en", "Never")).toMatch(/second/);
    expect(formatParentLastAccess("2026-08-31T11:30:00.000Z", "en", "Never")).toMatch(/minute/);
    expect(formatParentLastAccess("2026-08-31T09:00:00.000Z", "en", "Never")).toMatch(/hour/);
    expect(formatParentLastAccess("2026-08-20T12:00:00.000Z", "en", "Never")).toMatch(/day/);
    expect(formatParentLastAccess("2026-01-01T12:00:00.000Z", "en", "Never")).toMatch(/2026/);
  });
});
