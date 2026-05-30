import { describe, expect, it } from "vitest";
import {
  createDefaultSelectOptionRows,
  sanitizeEventFormFieldSelectOptions,
} from "@/lib/events/sanitizeEventFormFieldSelectOptions";

describe("sanitizeEventFormFieldSelectOptions", () => {
  it("requires at least two non-empty options", () => {
    expect(sanitizeEventFormFieldSelectOptions(["Only one"])).toEqual({
      ok: false,
      reason: "too_few_options",
    });
  });

  it("trims and keeps two or more options", () => {
    expect(sanitizeEventFormFieldSelectOptions(["  A ", "B ", " C"])).toEqual({
      ok: true,
      values: ["A", "B", "C"],
    });
  });

  it("rejects gaps between filled options", () => {
    expect(sanitizeEventFormFieldSelectOptions(["A", "", "C"])).toEqual({
      ok: false,
      reason: "empty_option",
    });
  });

  it("creates two default empty rows", () => {
    expect(createDefaultSelectOptionRows()).toEqual(["", ""]);
  });
});
