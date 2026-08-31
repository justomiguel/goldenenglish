import { describe, expect, it } from "vitest";
import { normalizeQuestionnaireSlug } from "@/lib/questionnaires/normalizeSlug";

describe("normalizeQuestionnaireSlug", () => {
  it("accepts kebab slugs between 2 and 80 chars", () => {
    expect(normalizeQuestionnaireSlug("satisfaccion-2026")).toEqual({
      ok: true,
      slug: "satisfaccion-2026",
    });
  });

  it("lowercases and trims", () => {
    expect(normalizeQuestionnaireSlug("  Hello-World  ")).toEqual({
      ok: true,
      slug: "hello-world",
    });
  });

  it("rejects empty, spaces, and leading/trailing hyphens", () => {
    expect(normalizeQuestionnaireSlug("")).toEqual({ ok: false });
    expect(normalizeQuestionnaireSlug("a")).toEqual({ ok: false });
    expect(normalizeQuestionnaireSlug("hello world")).toEqual({ ok: false });
    expect(normalizeQuestionnaireSlug("-hello")).toEqual({ ok: false });
  });
});
