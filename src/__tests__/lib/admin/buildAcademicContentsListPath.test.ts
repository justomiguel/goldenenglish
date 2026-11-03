import { describe, it, expect } from "vitest";
import { buildAcademicContentsListPath } from "@/lib/admin/buildAcademicContentsListPath";

describe("buildAcademicContentsListPath", () => {
  it("drops q when update trims to empty", () => {
    const path = buildAcademicContentsListPath("es", new URLSearchParams("q=old"), { q: "   " });
    expect(path).toBe("/es/dashboard/admin/academic/contents");
    expect(path).not.toContain("q=");
  });

  it("sets a tag and drops an empty material", () => {
    const path = buildAcademicContentsListPath("es", new URLSearchParams("material=pdf"), { tag: "a1", material: " " });
    expect(path).toContain("tag=a1");
    expect(path).not.toContain("material=");
  });
});
