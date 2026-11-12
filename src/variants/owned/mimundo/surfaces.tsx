import type { ReactNode } from "react";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { MiMundoRegisterHeader } from "@/components/molecules/MiMundoRegisterHeader";
import { PublicAnswerArticle } from "@/components/organisms/PublicAnswerArticle";
import { PublicBlogScreenMiMundo, type PublicBlogScreenMiMundoProps } from "@/components/organisms/PublicBlogScreenMiMundo";
import { PublicContactScreenMiMundo, type PublicContactScreenMiMundoProps } from "@/components/organisms/PublicContactScreenMiMundo";
import { MiMundoFontRoot } from "@/components/organisms/MiMundoFontRoot";
import { PublicPrivacyArticle } from "@/components/organisms/PublicPrivacyArticle";
import { RegisterMiMundoSurface, type RegisterMiMundoSurfaceProps } from "@/components/organisms/RegisterMiMundoSurface";

const SHEET = "mimundo-public-sheet mx-auto max-w-3xl";

interface MimundoSheetProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail?: string | null;
  logoAlt: string;
  title?: string;
  lead?: string;
  items?: readonly InstituteAnswerItem[];
}

function MimundoPublicSheet({ locale, dict, brand, sessionEmail = null, logoAlt, title, lead, items }: MimundoSheetProps) {
  const article = items ? (
    <PublicAnswerArticle title={title ?? ""} lead={lead ?? ""} items={items} />
  ) : (
    <PublicPrivacyArticle locale={locale} dict={dict} contact={brand} />
  );
  const labelledBy = items ? "public-answers-title" : "privacy-page-title";
  const logoSrc = brand.logoPath.trim();
  return (
    <MiMundoFontRoot className="relative min-h-screen pb-16">
      <MiMundoRegisterHeader
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        dict={dict}
        sessionEmail={sessionEmail}
      />
      <main aria-labelledby={labelledBy}>
        <div className="px-4 py-10 md:py-14">
          <div className={SHEET}>{article}</div>
        </div>
      </main>
      <PublicContentLanguageFooter locale={locale} labels={dict.common.locale} tone="light" />
    </MiMundoFontRoot>
  );
}

export const mimundoSurfaces = {
  owner: "mimundo",
  slots: {
    register: (props: object) => <RegisterMiMundoSurface {...(props as RegisterMiMundoSurfaceProps)} />,
    contact: (props: object) => <PublicContactScreenMiMundo {...(props as PublicContactScreenMiMundoProps)} />,
    blog: (props: object) => <PublicBlogScreenMiMundo {...(props as PublicBlogScreenMiMundoProps)} />,
    publicSheet: (props: object) => <MimundoPublicSheet {...(props as MimundoSheetProps)} />,
    chrome: (props: object) => {
      const fields = props as { className?: string; children: ReactNode };
      return <MiMundoFontRoot className={fields.className}>{fields.children}</MiMundoFontRoot>;
    },
  } as Record<string, (props: object) => ReactNode>,
};
