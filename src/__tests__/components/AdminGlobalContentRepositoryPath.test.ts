import { describe, expect, it } from "vitest";
import { buildAcademicContentsListPath } from "@/lib/admin/buildAcademicContentsListPath";

describe("buildAcademicContentsListPath", () => {
  it("preserves sectionId and updates q, resetting page to 1 when omitted from updates", () => {
    const sp = new URLSearchParams("sectionId=abc&page=3&q=old");
    const href = buildAcademicContentsListPath("en", sp, { page: 1, q: "new term" });
    const u = new URL(href, "http://localhost");
    expect(u.pathname).toBe("/en/dashboard/admin/academic/contents");
    expect(u.searchParams.get("sectionId")).toBe("abc");
    expect(u.searchParams.get("page")).toBe(null);
    expect(u.searchParams.get("q")).toBe("new term");
  });

  it("sets page when greater than 1", () => {
    const sp = new URLSearchParams("");
    expect(buildAcademicContentsListPath("es", sp, { page: 2 })).toBe(
      "/es/dashboard/admin/academic/contents?page=2",
    );
  });
});
