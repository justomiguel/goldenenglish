import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MatissSiteHeader } from "@/components/organisms/MatissSiteHeader";
import { MatissFontRoot } from "@/components/organisms/MatissFontRoot";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";

export interface PublicBlogScreenMatissProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail: string | null;
  blogLabel: string;
  eventsLabel: string;
  children: ReactNode;
}

export function PublicBlogScreenMatiss({
  locale,
  dict,
  brand,
  sessionEmail,
  blogLabel,
  eventsLabel,
  children,
}: PublicBlogScreenMatissProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);
  const prefix = `/${locale}`;

  return (
    <MatissFontRoot>
      <main className="relative min-h-screen overflow-x-clip">
        <MatissSiteHeader
          locale={locale}
          brandName={brand.name}
          logoAlt={brand.logoAlt}
          dict={dict}
          sessionEmail={sessionEmail}
          links={[
            { href: `${prefix}#sobre`, label: t("nav.sobreNosotros") },
            { href: `${prefix}/blog`, label: blogLabel },
            { href: `${prefix}/eventos`, label: eventsLabel },
            { href: `${prefix}#contacto`, label: t("nav.contacto") },
          ]}
          openMenu={t("chrome.openMenu")}
          closeMenu={t("chrome.closeMenu")}
        />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
        <PublicContentLanguageFooter locale={locale} labels={dict.common.locale} />
      </main>
    </MatissFontRoot>
  );
}
