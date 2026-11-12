import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { MIMUNDO_FONT_IDS, mimundoDesignTokens } from "@/variants/owned/mimundo/tokens";

function section(id: string, variantId: string): ThemeSection {
  return { id, variantId, major: 1, props: {} };
}

export const document: ThemeDocumentV1 = {
  contractVersion: 1,
  tokens: mimundoDesignTokens(),
  fontIds: { heading: MIMUNDO_FONT_IDS.heading, body: MIMUNDO_FONT_IDS.body },
  sections: [
    section("nav", "nav.mimundo"),
    section("hero", "hero.mimundo"),
    section("propuesta", "band.mimundo-propuesta"),
    section("salas", "band.mimundo-salas"),
    section("gallery", "band.mimundo-gallery"),
    section("contact-block", "contact.mimundo"),
  ],
  pages: {
    home: { sections: [section("home", "page.mimundo-home")] },
    register: { sections: [section("register", "page.mimundo-register")] },
    contact: { sections: [section("contact", "page.mimundo-contact")] },
    blog: { sections: [section("blog", "page.mimundo-blog")] },
  },
  editableBy: {},
};
