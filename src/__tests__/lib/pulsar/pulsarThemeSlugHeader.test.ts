import { describe, expect, it } from "vitest";
import { pulsarThemeSlugFromPath } from "@/lib/pulsar/pulsarThemeSlugHeader";

describe("pulsarThemeSlugFromPath", () => {
  it("reads the institute slug from the Pulsar theme editor path", () => {
    expect(pulsarThemeSlugFromPath("/es/admin/tenants/academia-sur/theme")).toBe(
      "academia-sur",
    );
    expect(
      pulsarThemeSlugFromPath("/en/admin/tenants/academia-sur/theme/landing/inicio"),
    ).toBe("academia-sur");
  });

  it("ignores the institute dashboard", () => {
    expect(pulsarThemeSlugFromPath("/es/dashboard/admin/cms/templates")).toBeNull();
  });
});
