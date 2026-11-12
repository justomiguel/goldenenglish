import { describe, expect, it } from "vitest";
import {
  isAllowedPath,
  matchInstituteHardcode,
} from "../../../scripts/lib/instituteHardcodeMatcher.mjs";

const slugs = ["nago", "liora", "matiss", "mozarthitos", "mimundo", "golden", "espaciozenit"];

function codes(path, text) {
  return matchInstituteHardcode(path, text, slugs).map((hit) => hit.code);
}

describe("matchInstituteHardcode", () => {
  it("flags a slug compared to a value", () => {
    expect(codes("src/lib/kind.ts", 'kind === "nago"')).toContain("slug_comparison");
    expect(codes("src/lib/kind.ts", 'case "liora":')).toContain("slug_comparison");
    expect(codes("src/lib/kind.ts", "x !== 'matiss'")).toContain("slug_comparison");
  });

  it("flags a slug used as a table key or array item", () => {
    expect(codes("src/lib/map.ts", "{ nago: 1 }")).toContain("slug_table");
    expect(codes("src/lib/map.ts", '["mozarthitos"]')).toContain("slug_table");
  });

  it("flags a slug in a file name", () => {
    expect(codes("src/lib/nagoLogo.ts", "export const x = 1;\n")).toContain("slug_file_name");
  });

  it("flags a slug in CSS", () => {
    expect(codes("src/app/x.css", ".liora-hero {\n")).toContain("slug_css");
    expect(codes("src/app/x.css", "color: var(--mimundo-ink);\n")).toContain("slug_css");
  });

  it("flags a dictionary namespace", () => {
    expect(codes("src/dictionaries/es.json", '"mimundo": {\n')).toContain("slug_dictionary");
  });

  it("ignores a slug inside a longer word", () => {
    expect(matchInstituteHardcode("src/lib/place.ts", "nagoya golden-ratio goldenHour", slugs)).toEqual([]);
  });

  it("allows the owner slug inside an owned folder and still flags another slug", () => {
    expect(matchInstituteHardcode("src/variants/owned/nago/x.tsx", 'kind === "nago"', slugs)).toEqual([]);
    expect(codes("src/variants/owned/nago/x.tsx", 'kind === "liora"')).toContain("slug_comparison");
  });

  it("allows tests", () => {
    expect(isAllowedPath("src/__tests__/x.test.ts", "nago")).toBe(true);
    expect(matchInstituteHardcode("src/__tests__/x.test.ts", 'kind === "nago"', slugs)).toEqual([]);
  });
});
