import { describe, expect, it } from "vitest";
import { ensureUniqueSlug, normalizeSlug } from "@/lib/blog/slug";

describe("blog slug helpers", () => {
  it("normalizes accents, spaces and symbols", () => {
    expect(normalizeSlug("  ¡Hola Inglés! Nivel #1  ")).toBe("hola-ingles-nivel-1");
  });

  it("returns a numbered suffix when slug already exists", () => {
    const existing = new Set(["my-post", "my-post-2"]);
    expect(ensureUniqueSlug("My Post", existing)).toBe("my-post-3");
  });

  it("falls back to post when source is empty", () => {
    expect(ensureUniqueSlug("   ", new Set())).toBe("post");
  });
});
