import { describe, expect, it } from "vitest";
import { courseSlugFromTitle } from "@/lib/courses/courseSlug";

describe("courseSlugFromTitle", () => {
  it("folds accents and appends a suffix when the slug is taken", () => {
    expect(courseSlugFromTitle("Inglés básico", new Set())).toBe("ingles-basico");
    expect(courseSlugFromTitle("Inglés básico", new Set(["ingles-basico"]))).toBe("ingles-basico-2");
  });
});
