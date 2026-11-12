import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { NAGO_FONT_IDS, nagoDesignTokens } from "@/variants/owned/nago/tokens";

function section(id: string, variantId: string): ThemeSection {
  return { id, variantId, major: 1, props: {} };
}

export const document: ThemeDocumentV1 = {
  contractVersion: 1,
  tokens: nagoDesignTokens(),
  fontIds: { heading: NAGO_FONT_IDS.heading, body: NAGO_FONT_IDS.body },
  sections: [section("nav", "nav.nago"), section("body", "band.nago-body")],
  pages: {
    home: { sections: [section("home", "page.nago-home")] },
    register: { sections: [section("register", "page.nago-register")] },
    contact: { sections: [section("contact", "page.nago-contact")] },
    blog: { sections: [section("blog", "page.nago-blog")] },
  },
  editableBy: {},
};
