import type { ReactNode } from "react";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { EspacioZenitRegisterHeader } from "@/components/molecules/EspacioZenitRegisterHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { PublicAnswerArticle } from "@/components/organisms/PublicAnswerArticle";
import { PublicBlogScreenEspacioZenit, type PublicBlogScreenEspacioZenitProps } from "@/components/organisms/PublicBlogScreenEspacioZenit";
import { PublicContactScreenEspacioZenit, type PublicContactScreenEspacioZenitProps } from "@/components/organisms/PublicContactScreenEspacioZenit";
import { EspacioZenitFontRoot } from "@/components/organisms/EspacioZenitFontRoot";
import { PublicPrivacyArticle } from "@/components/organisms/PublicPrivacyArticle";
import { RegisterEspacioZenitSurface, type RegisterEspacioZenitSurfaceProps } from "@/components/organisms/RegisterEspacioZenitSurface";

const SHEET =
  "ez-public-sheet mx-auto max-w-3xl rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-[#070b12]/80 p-6 md:p-8";

interface EspacioZenitSheetProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail?: string | null;
  logoAlt: string;
  title?: string;
  lead?: string;
  items?: readonly InstituteAnswerItem[];
}

function wash() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(48vh,480px)] bg-[radial-gradient(ellipse_90%_80%_at_50%_-10%,rgb(0_174_239_/14%)_0%,transparent_62%)]"
      aria-hidden
    />
  );
}

function EspacioZenitPublicSheet({
  locale,
  dict,
  brand,
  sessionEmail = null,
  logoAlt,
  title,
  lead,
  items,
}: EspacioZenitSheetProps) {
  const article = items ? (
    <PublicAnswerArticle title={title ?? ""} lead={lead ?? ""} items={items} />
  ) : (
    <PublicPrivacyArticle locale={locale} dict={dict} contact={brand} />
  );
  const labelledBy = items ? "public-answers-title" : "privacy-page-title";
  return (
    <EspacioZenitFontRoot className="relative min-h-screen overflow-x-hidden bg-black pb-16 text-white">
      <EspacioZenitRegisterHeader
        locale={locale}
        logoSrc={brand.logoPath.trim()}
        logoAlt={logoAlt}
        brandDisplayName={brand.name}
        dict={dict}
        sessionEmail={sessionEmail}
      />
      <main aria-labelledby={labelledBy}>
        {wash()}
        <div className="px-4 py-10 md:py-14">
          <div className={SHEET}>{article}</div>
        </div>
      </main>
      <PublicContentLanguageFooter
        locale={locale}
        labels={dict.common.locale}
        tone="dark"
        variant="compactDark"
      />
    </EspacioZenitFontRoot>
  );
}

export const espaciozenitSurfaces = {
  owner: "espaciozenit",
  slots: {
    register: (props: object) => <RegisterEspacioZenitSurface {...(props as RegisterEspacioZenitSurfaceProps)} />,
    contact: (props: object) => <PublicContactScreenEspacioZenit {...(props as PublicContactScreenEspacioZenitProps)} />,
    blog: (props: object) => <PublicBlogScreenEspacioZenit {...(props as PublicBlogScreenEspacioZenitProps)} />,
    publicSheet: (props: object) => <EspacioZenitPublicSheet {...(props as EspacioZenitSheetProps)} />,
    chrome: (props: object) => {
      const fields = props as { className?: string; children: ReactNode };
      return (
        <EspacioZenitFontRoot className={`${fields.className ?? ""} bg-black text-white`.trim()}>
          {fields.children}
        </EspacioZenitFontRoot>
      );
    },
  } as Record<string, (props: object) => ReactNode>,
};
