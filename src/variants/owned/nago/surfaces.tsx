import type { ReactNode } from "react";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { NagoRegisterHeader } from "@/components/molecules/NagoRegisterHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { PublicAnswerArticle } from "@/components/organisms/PublicAnswerArticle";
import { PublicBlogScreenNago, type PublicBlogScreenNagoProps } from "@/components/organisms/PublicBlogScreenNago";
import { PublicContactScreenNago, type PublicContactScreenNagoProps } from "@/components/organisms/PublicContactScreenNago";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";
import { PublicPrivacyArticle } from "@/components/organisms/PublicPrivacyArticle";
import { RegisterNagoSurface, type RegisterNagoSurfaceProps } from "@/components/organisms/RegisterNagoSurface";
import { resolveNagoLogo } from "@/lib/landing/nagoLogo";

const SHEET =
  "nago-public-sheet mx-auto max-w-3xl rounded-2xl border border-[var(--nago-gold)]/20 bg-[var(--nago-bg-2)] p-6 md:p-8";

interface NagoSheetProps {
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
      className="pointer-events-none absolute inset-x-0 top-[76px] -z-10 h-[min(46vh,420px)] bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,color-mix(in_srgb,var(--nago-gold)_16%,transparent)_0%,transparent_58%)]"
      aria-hidden
    />
  );
}

function NagoPublicSheet({
  locale,
  dict,
  brand,
  sessionEmail = null,
  logoAlt,
  title,
  lead,
  items,
}: NagoSheetProps) {
  const article = items ? (
    <PublicAnswerArticle title={title ?? ""} lead={lead ?? ""} items={items} />
  ) : (
    <PublicPrivacyArticle locale={locale} dict={dict} contact={brand} />
  );
  const labelledBy = items ? "public-answers-title" : "privacy-page-title";
  return (
    <NagoFontRoot className="relative min-h-screen pb-16">
      <NagoRegisterHeader
        locale={locale}
        logoSrc={resolveNagoLogo(brand)}
        logoAlt={logoAlt}
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
    </NagoFontRoot>
  );
}

export const nagoSurfaces = {
  owner: "nago",
  slots: {
    register: (props: object) => <RegisterNagoSurface {...(props as RegisterNagoSurfaceProps)} />,
    contact: (props: object) => <PublicContactScreenNago {...(props as PublicContactScreenNagoProps)} />,
    blog: (props: object) => <PublicBlogScreenNago {...(props as PublicBlogScreenNagoProps)} />,
    publicSheet: (props: object) => <NagoPublicSheet {...(props as NagoSheetProps)} />,
    chrome: (props: object) => {
      const fields = props as { className?: string; children: ReactNode };
      return (
        <NagoFontRoot className={fields.className} sound={false}>
          {fields.children}
        </NagoFontRoot>
      );
    },
  } as Record<string, (props: object) => ReactNode>,
};
