import { describe, expect, it } from "vitest";
import { canDeleteArticle } from "@/lib/blog/permissions";

describe("canDeleteArticle", () => {
  it("allows admin and assistant", () => {
    expect(canDeleteArticle("admin")).toBe(true);
    expect(canDeleteArticle("assistant")).toBe(true);
  });

  it("denies teachers and portal roles", () => {
    expect(canDeleteArticle("teacher")).toBe(false);
    expect(canDeleteArticle("student")).toBe(false);
    expect(canDeleteArticle("parent")).toBe(false);
  });
});
