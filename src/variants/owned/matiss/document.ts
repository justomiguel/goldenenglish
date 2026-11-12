import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { MATISS_FONT_IDS, matissDesignTokens } from "@/variants/owned/matiss/tokens";

function section(id: string, variantId: string): ThemeSection {
  return { id, variantId, major: 1, props: {} };
}

export const document: ThemeDocumentV1 = {
  contractVersion: 1,
  tokens: matissDesignTokens(),
  fontIds: { heading: MATISS_FONT_IDS.heading, body: MATISS_FONT_IDS.body },
  sections: [
    section("nav", "nav.matiss"),
    section("hero", "hero.matiss"),
    section("manifesto", "band.matiss-manifesto"),
    section("benefits", "band.matiss-benefits"),
    section("programs", "band.matiss-programs"),
    section("age", "schedule.matiss-age"),
    section("class-day", "band.matiss-class-day"),
    section("first-class", "band.matiss-first-class"),
    section("gala", "band.matiss-gala"),
    section("gallery", "band.matiss-gallery"),
    section("locations", "band.matiss-locations"),
    section("faq", "faq.matiss"),
    section("contact-block", "contact.matiss"),
    section("footer", "footer.matiss"),
  ],
  pages: {
    home: { sections: [section("home", "page.matiss-home")] },
    register: { sections: [section("register", "page.matiss-register")] },
    contact: { sections: [section("contact", "page.matiss-contact")] },
    blog: { sections: [section("blog", "page.matiss-blog")] },
  },
  editableBy: {},
};
