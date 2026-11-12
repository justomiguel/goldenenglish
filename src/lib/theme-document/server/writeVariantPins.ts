import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import { createPulsarAdminClient } from "@/lib/supabase/pulsar";

export async function writeVariantPins(slug: string, sections: readonly ThemeSection[]): Promise<void> {
  const client = createPulsarAdminClient();
  const removed = await client.from("platform_tenant_variant_pins").delete().eq("tenant_slug", slug);
  if (removed.error) throw removed.error;
  const seen = new Set<string>();
  const rows = [];
  for (const section of sections) {
    const key = `${section.variantId}@${section.major}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ tenant_slug: slug, variant_id: section.variantId, major: section.major });
  }
  if (rows.length === 0) return;
  const inserted = await client.from("platform_tenant_variant_pins").insert(rows);
  if (inserted.error) throw inserted.error;
}
