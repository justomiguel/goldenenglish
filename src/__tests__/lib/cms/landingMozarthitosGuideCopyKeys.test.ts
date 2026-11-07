import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";
import { MOZARTHITOS_GUIDE_COPY_KEYS } from "@/lib/cms/landingMozarthitosGuideCopyKeys";
import { MOZARTHITOS_LANDING_COPY_KEYS_BY_SECTION } from "@/lib/cms/landingMozarthitosCatalog";

function at(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (cursor, segment) =>
      cursor && typeof cursor === "object" ? (cursor as Record<string, unknown>)[segment] : undefined,
    root,
  );
}

describe("MOZARTHITOS_GUIDE_COPY_KEYS", () => {
  it("lives in the niveles CMS section", () => {
    expect(MOZARTHITOS_LANDING_COPY_KEYS_BY_SECTION.niveles).toEqual(MOZARTHITOS_GUIDE_COPY_KEYS);
  });

  it.each([
    ["en", en],
    ["es", es],
    ["pt", pt],
  ])("points at non-empty strings in %s", (_locale, dict) => {
    for (const key of MOZARTHITOS_GUIDE_COPY_KEYS) {
      const value = at(dict.landing, key);
      expect(typeof value, key).toBe("string");
      expect(String(value).trim().length, key).toBeGreaterThan(0);
    }
  });
});
