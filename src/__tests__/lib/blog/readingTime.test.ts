import { describe, expect, it } from "vitest";
import { calculateReadingTimeMinutes } from "@/lib/blog/readingTime";

describe("calculateReadingTimeMinutes", () => {
  it("returns minimum one minute", () => {
    expect(calculateReadingTimeMinutes("")).toBe(1);
  });

  it("scales by words", () => {
    const text = Array.from({ length: 500 }, () => "word").join(" ");
    expect(calculateReadingTimeMinutes(text)).toBe(3);
  });
});
