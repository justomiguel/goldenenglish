import { describe, expect, it } from "vitest";
import { BLOG_TAG_MAX, normalizeTag, normalizeTags } from "@/lib/blog/tags";

describe("blog tags", () => {
  it("normalizes hashtag prefixes and accents", () => {
    expect(normalizeTag("##Gramática avanzada")).toBe("gramatica-avanzada");
  });

  it("deduplicates and drops empty tags", () => {
    expect(
      normalizeTags(["English Tips", "english tips", "#", "Exam Prep"]),
    ).toEqual(["english-tips", "exam-prep"]);
  });

  it("caps at max tags", () => {
    const many = Array.from({ length: BLOG_TAG_MAX + 10 }, (_, idx) => `Tag ${idx}`);
    expect(normalizeTags(many)).toHaveLength(BLOG_TAG_MAX);
  });
});
