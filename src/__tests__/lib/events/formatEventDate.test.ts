import { describe, expect, it } from "vitest";
import { formatEventDate } from "@/lib/events/formatEventDate";

describe("formatEventDate", () => {
  it("formats a Date instance", () => {
    expect(formatEventDate(new Date("2026-08-01T15:00:00.000Z"), "es-CL")).not.toBe("");
  });
});
