import type { ReactNode } from "react";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { LioraRegisterHeader } from "@/components/molecules/LioraRegisterHeader";
import { PublicAnswerArticle } from "@/components/organisms/PublicAnswerArticle";
import { PublicBlogScreenLiora, type PublicBlogScreenLioraProps } from "@/components/organisms/PublicBlogScreenLiora";
import { PublicContactScreenLiora, type PublicContactScreenLioraProps } from "@/components/organisms/PublicContactScreenLiora";
import { LioraFontRoot } from "@/components/organisms/LioraFontRoot";
import { PublicPrivacyArticle } from "@/components/organisms/PublicPrivacyArticle";
import { RegisterLioraSurface, type RegisterLioraSurfaceProps } from "@/components/organisms/RegisterLioraSurface";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

const SHEET = "liora-public-sheet mx-auto max-w-3xl";

interface LioraSheetProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail?: string | null;
  logoAlt: string;
  title?: string;
  lead?: string;
  items?: readonly InstituteAnswerItem[];
}

function LioraPublicSheet({ locale, dict, brand, sessionEmail = null, logoAlt, title, lead, items }: LioraSheetProps) {
  const article = items ? (
    <PublicAnswerArticle title={title ?? ""} lead={lead ?? ""} items={items} />
  ) : (
    <PublicPrivacyArticle locale={locale} dict={dict} contact={brand} />
  );
  const labelledBy = items ? "public-answers-title" : "privacy-page-title";
  return (
    <LioraFontRoot className="relative min-h-screen pb-16">
      <LioraRegisterHeader
        locale={locale}
        brandName={brand.name}
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
    </LioraFontRoot>
  );
}

export const lioraSurfaces = {
  owner: "liora",
  slots: {
    register: (props: object) => <RegisterLioraSurface {...(props as RegisterLioraSurfaceProps)} />,
    contact: (props: object) => <PublicContactScreenLiora {...(props as PublicContactScreenLioraProps)} />,
    blog: (props: object) => {
      const fields = props as PublicBlogScreenLioraProps;
      return (
        <PublicBlogScreenLiora
          {...fields}
          eventsLabel={marketingLandingCopy(fields.dict, "liora", "nav.eventos")}
        />
      );
    },
    publicSheet: (props: object) => <LioraPublicSheet {...(props as LioraSheetProps)} />,
    chrome: (props: object) => {
      const fields = props as { className?: string; children: ReactNode };
      return <LioraFontRoot className={fields.className}>{fields.children}</LioraFontRoot>;
    },
  } as Record<string, (props: object) => ReactNode>,
};
