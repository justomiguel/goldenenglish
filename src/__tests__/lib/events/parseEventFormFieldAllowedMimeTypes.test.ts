import { describe, expect, it } from "vitest";
import { parseEventFormFieldAllowedMimeTypes } from "@/lib/events/parseEventFormFieldAllowedMimeTypes";

describe("parseEventFormFieldAllowedMimeTypes", () => {
  it("parses comma-separated mime types in lowercase without duplicates", () => {
    expect(parseEventFormFieldAllowedMimeTypes(" image/jpeg , IMAGE/PNG, image/jpeg ")).toEqual([
      "image/jpeg",
      "image/png",
    ]);
  });

  it("returns empty array for blank input", () => {
    expect(parseEventFormFieldAllowedMimeTypes("  ,  ")).toEqual([]);
  });
});
