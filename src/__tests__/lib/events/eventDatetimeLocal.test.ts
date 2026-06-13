import { describe, expect, it } from "vitest";
import {
  eventDatetimeLocalToIso,
  isoToEventDatetimeLocalValue,
} from "@/lib/events/eventDatetimeLocal";

describe("eventDatetimeLocal", () => {
  it("round-trips a valid ISO timestamp through datetime-local", () => {
    const iso = "2026-06-15T18:30:00.000Z";
    const local = isoToEventDatetimeLocalValue(iso);
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    const back = eventDatetimeLocalToIso(local);
    expect(back).toBe(new Date(local).toISOString());
  });

  it("returns null for empty datetime-local", () => {
    expect(eventDatetimeLocalToIso("")).toBeNull();
  });
});
