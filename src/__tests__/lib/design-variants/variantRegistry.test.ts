import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createVariantRegistry } from "@/lib/design-variants/variantRegistry";
import type { SectionVariant } from "@/lib/design-variants/sectionVariant";

const schema = z.object({ title: z.string() });

function entry(partial: Partial<SectionVariant<unknown>> & Pick<SectionVariant<unknown>, "id" | "major">): SectionVariant<unknown> {
  return {
    slot: "hero",
    patch: 0,
    propsSchema: schema,
    editorFields: [],
    consumesTokens: [],
    interactive: false,
    web: async () => ({ default: () => null }),
    ...partial,
  };
}

const registry = createVariantRegistry([
  entry({ id: "hero.split", major: 1 }),
  entry({ id: "hero.split", major: 2 }),
  entry({ id: "hero.owned", major: 1, owner: "liora" }),
]);

describe("createVariantRegistry", () => {
  it("returns variant_version_missing for an unknown major", () => {
    const result = registry.resolveSection({ id: "s1", variantId: "hero.split", major: 9, props: { title: "A" } }, "golden");
    expect(result).toEqual({ ok: false, code: "variant_version_missing" });
  });

  it("resolves an owned variant only for its owner", () => {
    const section = { id: "s2", variantId: "hero.owned", major: 1, props: { title: "A" } };
    expect(registry.resolveSection(section, "liora").ok).toBe(true);
    expect(registry.resolveSection(section, "golden")).toEqual({ ok: false, code: "variant_not_available" });
    expect(registry.resolveSection(section, null)).toEqual({ ok: false, code: "variant_not_available" });
  });

  it("returns variant_props_invalid when props fail the schema", () => {
    const result = registry.resolveSection({ id: "s3", variantId: "hero.split", major: 1, props: {} }, "golden");
    expect(result).toEqual({ ok: false, code: "variant_props_invalid" });
  });

  it("returns the highest major and the tenant's own variants", () => {
    expect(registry.latestMajor("hero.split")).toBe(2);
    expect(registry.latestMajor("missing")).toBeNull();
    const ids = registry.variantsForTenant("liora").map((item) => item.id);
    expect(ids).toEqual(["hero.split", "hero.split", "hero.owned"]);
    expect(registry.variantsForTenant("golden").map((item) => item.id)).toEqual(["hero.split", "hero.split"]);
    expect(registry.variantsForTenant(null, "hero").some((item) => item.owner)).toBe(false);
  });
});
