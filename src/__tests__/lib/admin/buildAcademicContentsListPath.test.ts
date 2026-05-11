import { describe, it, expect } from "vitest";
import { buildAcademicContentsListPath } from "@/lib/admin/buildAcademicContentsListPath";

describe("buildAcademicContentsListPath", () => {
  it("drops q when update trims to empty", () => {
    const path = buildAcademicContentsListPath("es", new URLSearchParams("q=old"), { q: "   " });
    expect(path).toBe("/es/dashboard/admin/academic/contents");
    expect(path).not.toContain("q=");
  });
});
