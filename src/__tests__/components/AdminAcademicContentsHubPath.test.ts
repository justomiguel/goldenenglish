import { describe, expect, it } from "vitest";
import { buildAcademicContentsHubPath } from "@/components/admin/AdminAcademicContentsScreen";

describe("buildAcademicContentsHubPath", () => {
  it("sets tab=routes and preserves pagination query", () => {
    const sp = new URLSearchParams("page=2&q=hello");
    const href = buildAcademicContentsHubPath("en", sp, { tab: "routes" });
    const u = new URL(href, "http://localhost");
    expect(u.searchParams.get("tab")).toBe("routes");
    expect(u.searchParams.get("page")).toBe("2");
    expect(u.searchParams.get("q")).toBe("hello");
  });

  it("removes tab when switching to repository", () => {
    const sp = new URLSearchParams("tab=routes&page=1");
    const href = buildAcademicContentsHubPath("es", sp, { tab: "repository" });
    expect(href).toBe("/es/dashboard/admin/academic/contents?page=1");
  });
});
