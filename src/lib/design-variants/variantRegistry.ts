import { ALL_VARIANTS } from "@/lib/design-variants/registry";
import type {
  ResolveSectionResult,
  SectionSlot,
  SectionVariant,
  ThemeSection,
} from "@/lib/design-variants/sectionVariant";

export function createVariantRegistry(entries: readonly SectionVariant<unknown>[]) {
  function getVariant(id: string, major: number): SectionVariant<unknown> | null {
    return entries.find((entry) => entry.id === id && entry.major === major) ?? null;
  }

  function latestMajor(id: string): number | null {
    let best: number | null = null;
    for (const entry of entries) {
      if (entry.id !== id) continue;
      if (best === null || entry.major > best) best = entry.major;
    }
    return best;
  }

  function variantsForTenant(tenantSlug: string | null, slot?: SectionSlot): SectionVariant<unknown>[] {
    return entries.filter((entry) => {
      if (slot && entry.slot !== slot) return false;
      if (!entry.owner) return true;
      return tenantSlug !== null && entry.owner === tenantSlug;
    });
  }

  function resolveSection(section: ThemeSection, tenantSlug: string | null): ResolveSectionResult {
    const variant = getVariant(section.variantId, section.major);
    if (!variant) return { ok: false, code: "variant_version_missing" };
    if (variant.owner && variant.owner !== tenantSlug) return { ok: false, code: "variant_not_available" };
    const parsed = variant.propsSchema.safeParse(section.props);
    if (!parsed.success) return { ok: false, code: "variant_props_invalid" };
    return { ok: true, variant, props: parsed.data };
  }

  return { getVariant, latestMajor, variantsForTenant, resolveSection };
}

const live = createVariantRegistry(ALL_VARIANTS);

export function getVariant(id: string, major: number): SectionVariant<unknown> | null {
  return live.getVariant(id, major);
}

export function latestMajor(id: string): number | null {
  return live.latestMajor(id);
}

export function variantsForTenant(tenantSlug: string | null, slot?: SectionSlot): SectionVariant<unknown>[] {
  return live.variantsForTenant(tenantSlug, slot);
}

export function resolveSection(section: ThemeSection, tenantSlug: string | null): ResolveSectionResult {
  return live.resolveSection(section, tenantSlug);
}
