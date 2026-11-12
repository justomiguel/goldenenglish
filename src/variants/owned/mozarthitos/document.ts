import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { MOZARTHITOS_FONT_IDS, mozarthitosDesignTokens } from "@/variants/owned/mozarthitos/tokens";

function section(id: string, variantId: string): ThemeSection {
  return { id, variantId, major: 1, props: {} };
}

export const document: ThemeDocumentV1 = {
  contractVersion: 1,
  tokens: mozarthitosDesignTokens(),
  fontIds: { heading: MOZARTHITOS_FONT_IDS.heading, body: MOZARTHITOS_FONT_IDS.body },
  sections: [
    section("nav", "nav.mozarthitos"),
    section("body", "band.mozarthitos-body"),
    section("cursos", "band.mozarthitos-cursos"),
    section("sedes", "band.mozarthitos-sedes"),
    section("contact-block", "contact.mozarthitos"),
  ],
  pages: {
    home: { sections: [section("home", "page.mozarthitos-home")] },
    register: { sections: [section("register", "page.mozarthitos-register")] },
    contact: { sections: [section("contact", "page.mozarthitos-contact")] },
    blog: { sections: [section("blog", "page.mozarthitos-blog")] },
    findClass: { sections: [section("guide", "page.find-class")] },
  },
  editableBy: {},
};
