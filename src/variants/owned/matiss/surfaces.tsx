import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { PublicBlogScreenMatiss, type PublicBlogScreenMatissProps } from "@/variants/owned/matiss/blog/v1/Web";
import { PublicContactScreenMatiss, type PublicContactScreenMatissProps } from "@/variants/owned/matiss/contact-page/v1/Web";
import { MatissFontRoot } from "@/variants/owned/matiss/font/v1/Web";
import { MatissSiteHeader } from "@/variants/owned/matiss/header/v1/Web";
import { RegisterMatissSurface, type RegisterMatissSurfaceProps } from "@/variants/owned/matiss/register/v1/Web";

interface MatissSheetProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail?: string | null;
  logoAlt: string;
  children: ReactNode;
}

function MatissPublicSheet({ locale, dict, brand, sessionEmail = null, logoAlt, children }: MatissSheetProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);
  return (
    <MatissFontRoot className="relative min-h-screen pb-16">
      <MatissSiteHeader
        locale={locale}
        brandName={brand.name}
        logoAlt={logoAlt}
        dict={dict}
        sessionEmail={sessionEmail}
        links={[{ href: `/${locale}`, label: t("nav.inicio") }]}
        openMenu={t("chrome.openMenu")}
        closeMenu={t("chrome.closeMenu")}
      />
      {children}
    </MatissFontRoot>
  );
}

export const matissSurfaces = {
  owner: "matiss",
  slots: {
    register: (props: object) => <RegisterMatissSurface {...(props as RegisterMatissSurfaceProps)} />,
    contact: (props: object) => <PublicContactScreenMatiss {...(props as PublicContactScreenMatissProps)} />,
    blog: (props: object) => <PublicBlogScreenMatiss {...(props as PublicBlogScreenMatissProps)} />,
    publicSheet: (props: object) => <MatissPublicSheet {...(props as MatissSheetProps)} />,
    chrome: (props: object) => {
      const fields = props as { className?: string; children: ReactNode };
      return <MatissFontRoot className={fields.className}>{fields.children}</MatissFontRoot>;
    },
  } as Record<string, (props: object) => ReactNode>,
};
