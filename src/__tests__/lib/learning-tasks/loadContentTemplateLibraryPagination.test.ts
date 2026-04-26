import { describe, expect, it } from "vitest";
import { clampContentTemplateRepositoryPage } from "@/lib/learning-tasks/loadContentTemplateLibrary";

describe("clampContentTemplateRepositoryPage", () => {
  it("returns 1 when total is zero", () => {
    expect(clampContentTemplateRepositoryPage(5, 0, 20)).toBe(1);
  });

  it("clamps high pages to the last page", () => {
    expect(clampContentTemplateRepositoryPage(10, 45, 20)).toBe(3);
  });

  it("clamps below 1 to 1", () => {
    expect(clampContentTemplateRepositoryPage(0, 100, 20)).toBe(1);
  });
});
