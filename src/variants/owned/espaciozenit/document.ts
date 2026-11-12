import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { ESPACIOZENIT_FONT_IDS, espaciozenitDesignTokens } from "@/variants/owned/espaciozenit/tokens";

function section(id: string, variantId: string): ThemeSection {
  return { id, variantId, major: 1, props: {} };
}

export const document: ThemeDocumentV1 = {
  contractVersion: 1,
  tokens: espaciozenitDesignTokens(),
  fontIds: { heading: ESPACIOZENIT_FONT_IDS.heading, body: ESPACIOZENIT_FONT_IDS.body },
  sections: [
    section("nav", "nav.espaciozenit"),
    section("body", "band.espaciozenit-body"),
    section("footer", "footer.espaciozenit"),
  ],
  pages: {
    home: { sections: [section("home", "page.espaciozenit-home")] },
    register: { sections: [section("register", "page.espaciozenit-register")] },
    contact: { sections: [section("contact", "page.espaciozenit-contact")] },
    blog: { sections: [section("blog", "page.espaciozenit-blog")] },
  },
  editableBy: {},
};
