import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { LIORA_FONT_IDS, lioraDesignTokens } from "@/variants/owned/liora/tokens";

function section(id: string, variantId: string): ThemeSection {
  return { id, variantId, major: 1, props: {} };
}

export const document: ThemeDocumentV1 = {
  contractVersion: 1,
  tokens: lioraDesignTokens(),
  fontIds: { heading: LIORA_FONT_IDS.heading, body: LIORA_FONT_IDS.body },
  sections: [
    section("nav", "nav.liora"),
    section("hero", "hero.liora"),
    section("sobre", "band.liora-sobre"),
    section("clases", "band.liora-clases"),
    section("sedes", "band.liora-sedes"),
    section("horarios", "schedule.liora-horarios"),
    section("gallery", "band.liora-gallery"),
    section("contact-block", "contact.liora"),
    section("footer", "footer.liora"),
  ],
  pages: {
    home: { sections: [section("home", "page.liora-home")] },
    register: { sections: [section("register", "page.liora-register")] },
    contact: { sections: [section("contact", "page.liora-contact")] },
    blog: { sections: [section("blog", "page.liora-blog")] },
  },
  editableBy: {},
};
