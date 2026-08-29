/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The loader is a thin PostgREST query; asserting on its column list is the cheapest
// way to keep the badge from silently losing its data source.
describe("loadPaginatedRegistrations column list", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/lib/dashboard/loadPaginatedRegistrations.ts"),
    "utf-8",
  );

  it("selects the section link attribution column", () => {
    expect(source).toContain("source_section_link_id");
  });

  it("selects additional requested sections", () => {
    expect(source).toContain("additional_section_ids");
    expect(source).toContain("additionalSectionIds");
  });

  it("maps it onto the row model", () => {
    expect(source).toContain("sourceSectionLinkId");
  });

  it("selects registration intent for the trial badge", () => {
    expect(source).toContain("intent");
  });

  it("still avoids select all", () => {
    expect(source).not.toMatch(/select\(\s*["'`]\*/);
  });
});
