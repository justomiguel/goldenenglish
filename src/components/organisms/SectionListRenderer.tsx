import type { ReactNode } from "react";
import type { ComponentType } from "react";
import { VariantSurfaceEntry } from "@/components/organisms/VariantSurfaceEntry";
import { resolveSection } from "@/lib/design-variants/variantRegistry";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

export interface SectionListRendererProps {
  sections: readonly ThemeSection[];
  tenantSlug: string | null;
  locale: Locale;
}

export async function SectionListRenderer({
  sections,
  tenantSlug,
  locale,
}: SectionListRendererProps): Promise<ReactNode> {
  const nodes: ReactNode[] = [];
  for (const section of sections) {
    const resolved = resolveSection(section, tenantSlug);
    if (!resolved.ok) {
      await logServerWarn("designVariants.render", {
        code: resolved.code,
        sectionId: section.id,
        variantId: section.variantId,
        major: section.major,
        locale,
      });
      continue;
    }
    const key = `${resolved.variant.id}@${resolved.variant.major}`;
    if (resolved.variant.pwa) {
      nodes.push(<VariantSurfaceEntry key={section.id} variantKey={key} props={resolved.props} />);
      continue;
    }
    const loaded = await resolved.variant.web();
    const View = loaded.default as ComponentType<Record<string, unknown>>;
    const fields = resolved.props && typeof resolved.props === "object" ? (resolved.props as Record<string, unknown>) : {};
    nodes.push(<View key={section.id} {...fields} />);
  }
  return <>{nodes}</>;
}
