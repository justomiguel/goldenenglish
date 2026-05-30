import { describe, expect, it } from "vitest";
import { buildSimpleTsQuery, tokenizeBlogSearchQuery } from "@/lib/blog/searchTokenize";

describe("searchTokenize", () => {
  it("builds normalized tokens", () => {
    expect(tokenizeBlogSearchQuery("  Prep! B2 exam? ")).toEqual(["prep", "b2", "exam"]);
  });

  it("ignores one-character tokens", () => {
    expect(tokenizeBlogSearchQuery("a b cd ef")).toEqual(["cd", "ef"]);
  });

  it("builds tsquery expression", () => {
    expect(buildSimpleTsQuery("exam prep")).toBe("exam:* & prep:*");
  });

  it("returns empty tokens and tsquery for blank input", () => {
    expect(tokenizeBlogSearchQuery("   ")).toEqual([]);
    expect(buildSimpleTsQuery("   ")).toBe("");
  });

  it("caps token count at eight", () => {
    expect(tokenizeBlogSearchQuery("one two three four five six seven eight nine ten")).toHaveLength(8);
  });
});
