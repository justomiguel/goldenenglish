import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { legacyThemeToDocument } from "@/lib/theme-document/legacyThemeToDocument";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import type { SkinLocale } from "@/lib/landing/skin/skinModel";
import type { Dictionary } from "@/types/i18n";

export function starterDocument(
  kind: GenericInstituteKind,
  dict: Dictionary,
  locale: SkinLocale = "es",
): ThemeDocumentV1 {
  return legacyThemeToDocument(
    { properties: {}, skin_content: null, template_kind: kind },
    { dict, locale },
  );
}
