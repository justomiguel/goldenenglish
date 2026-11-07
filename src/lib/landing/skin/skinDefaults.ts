import type { ResolvedSkin } from "@/lib/landing/skin/skinModel";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";

/** Sample content of one skin in the active locale. The owner overrides it later. */
export function skinDefaults(dict: Dictionary, kind: GenericInstituteKind): ResolvedSkin {
  const skin: ResolvedSkin = dict.landing.skins[kind];
  return skin;
}
