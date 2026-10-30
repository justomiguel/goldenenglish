import { describe, expect, it } from "vitest";
import { canCreateFreeSite, freeSiteCreateError } from "@/lib/pulsar/freeSitePlan";

describe("freeSitePlan", () => {
  it("allows fewer than 3 sites on the shared generic plan", () => {
    expect(canCreateFreeSite(2)).toBe(true);
    expect(
      freeSiteCreateError({
        ownedCount: 2,
        dataMode: "shared_schema",
        brandThemeSlug: "generic-deportes",
      }),
    ).toBeNull();
  });

  it("blocks a fourth site, an external database, and a branded template", () => {
    expect(freeSiteCreateError({
      ownedCount: 3,
      dataMode: "shared_schema",
      brandThemeSlug: "generic-deportes",
    })).toBe("free_site_limit");
    expect(freeSiteCreateError({
      ownedCount: 0,
      dataMode: "project",
      brandThemeSlug: "generic-deportes",
    })).toBe("free_plan_shared_only");
    expect(freeSiteCreateError({
      ownedCount: 0,
      dataMode: "shared_schema",
      brandThemeSlug: "nago",
    })).toBe("free_plan_generic_template");
  });
});
