import { legacyGenericContentToSkin } from "@/lib/landing/skin/legacyGenericContentToSkin";
import { mergeSkinContent, resolveSkin } from "@/lib/landing/skin/resolveSkin";
import { skinDefaults } from "@/lib/landing/skin/skinDefaults";
import type { ResolvedSkin, SkinContentV1, SkinLocale } from "@/lib/landing/skin/skinModel";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeContent } from "@/types/theming";

/**
 * Pure composition: skin defaults for the kind, legacy owner text mapped to the
 * skin model, and stored `skin_content`, merged and resolved for one locale.
 * Stored `skin_content` wins over legacy text. Legacy text wins over defaults.
 */
export function buildResolvedSkin(args: {
  dict: Dictionary;
  kind: GenericInstituteKind;
  content: SiteThemeContent | null | undefined;
  skinContent: SkinContentV1;
  locale: SkinLocale;
}): ResolvedSkin {
  const stored = mergeSkinContent(legacyGenericContentToSkin(args.content), args.skinContent);
  return resolveSkin({ defaults: skinDefaults(args.dict, args.kind), stored, locale: args.locale });
}
