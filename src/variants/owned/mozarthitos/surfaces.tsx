import type { ReactNode } from "react";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { MozarthitosRegisterHeader } from "@/components/molecules/MozarthitosRegisterHeader";
import { PublicAnswerArticle } from "@/components/organisms/PublicAnswerArticle";
import {
  PublicBlogScreenMozarthitos,
  type PublicBlogScreenMozarthitosProps,
} from "@/components/organisms/PublicBlogScreenMozarthitos";
import {
  PublicContactScreenMozarthitos,
  type PublicContactScreenMozarthitosProps,
} from "@/components/organisms/PublicContactScreenMozarthitos";
import { MozarthitosFontRoot } from "@/components/organisms/MozarthitosFontRoot";
import { PublicPrivacyArticle } from "@/components/organisms/PublicPrivacyArticle";
import {
  RegisterMozarthitosSurface,
  type RegisterMozarthitosSurfaceProps,
} from "@/components/organisms/RegisterMozarthitosSurface";

const SHEET = "mz-public-sheet mx-auto max-w-3xl";

interface MozarthitosSheetProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail?: string | null;
  logoAlt: string;
  title?: string;
  lead?: string;
  items?: readonly InstituteAnswerItem[];
}

function MozarthitosPublicSheet({
  locale,
  dict,
  brand,
  sessionEmail = null,
  logoAlt,
  title,
  lead,
  items,
}: MozarthitosSheetProps) {
  const logoSrc = brand.logoPath.trim();
  const article = items ? (
    <PublicAnswerArticle title={title ?? ""} lead={lead ?? ""} items={items} />
  ) : (
    <PublicPrivacyArticle locale={locale} dict={dict} contact={brand} />
  );
  const labelledBy = items ? "public-answers-title" : "privacy-page-title";
  return (
    <MozarthitosFontRoot className="relative min-h-screen pb-16">
      <MozarthitosRegisterHeader
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
    </MozarthitosFontRoot>
  );
}

export const mozarthitosSurfaces = {
  owner: "mozarthitos",
  slots: {
    register: (props: object) => <RegisterMozarthitosSurface {...(props as RegisterMozarthitosSurfaceProps)} />,
    contact: (props: object) => <PublicContactScreenMozarthitos {...(props as PublicContactScreenMozarthitosProps)} />,
    blog: (props: object) => <PublicBlogScreenMozarthitos {...(props as PublicBlogScreenMozarthitosProps)} />,
    publicSheet: (props: object) => <MozarthitosPublicSheet {...(props as MozarthitosSheetProps)} />,
    chrome: (props: object) => {
      const fields = props as { className?: string; children: ReactNode };
      return <MozarthitosFontRoot className={fields.className}>{fields.children}</MozarthitosFontRoot>;
    },
  } as Record<string, (props: object) => ReactNode>,
};
