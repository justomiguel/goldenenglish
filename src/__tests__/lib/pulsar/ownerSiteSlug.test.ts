import { describe, expect, it } from "vitest";
import { ownerSiteSlug } from "@/lib/pulsar/ownerSiteSlug";

describe("ownerSiteSlug", () => {
  it("keeps letters and numbers and turns the rest into hyphens", () => {
    expect(ownerSiteSlug("Mi Escuela")).toBe("mi-escuela");
    expect(ownerSiteSlug("escuela_1")).toBe("escuela-1");
    expect(ownerSiteSlug("Ñandú!")).toBe("nandu");
    expect(ownerSiteSlug("  club-norte  ")).toBe("club-norte");
    expect(ownerSiteSlug("---")).toBe("");
    expect(ownerSiteSlug("a")).toBe("a");
    expect(ownerSiteSlug("x".repeat(80))).toBe("x".repeat(50));
  });
});
