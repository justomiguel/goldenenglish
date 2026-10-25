import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";

export interface PublicBlogScreenClassicProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail: string | null;
  blogEnabled: boolean;
  merchEnabled?: boolean;
  blogLabel: string;
  eventsLabel: string;
  children: ReactNode;
}

export function PublicBlogScreenClassic({
  locale,
  dict,
  brand,
  sessionEmail,
  blogEnabled,
  merchEnabled = false,
  blogLabel,
  eventsLabel,
  children,
}: PublicBlogScreenClassicProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-muted)] px-4 py-10 md:py-14">
      <RegisterSiteHeader
        brand={brand}
        locale={locale}
        dict={dict}
        sessionEmail={sessionEmail}
        eventsHref={`/${locale}/events`}
        eventsLabel={eventsLabel}
        shopHref={merchEnabled ? `/${locale}/tienda` : undefined}
        shopLabel={merchEnabled ? dict.shop.catalog.title : undefined}
        blogHref={blogEnabled ? `/${locale}/blog` : undefined}
        blogLabel={blogEnabled ? blogLabel : undefined}
      />
      <div className="mx-auto w-full max-w-6xl">{children}</div>
      <PublicContentLanguageFooter
        locale={locale}
        labels={dict.common.locale}
      />
    </div>
  );
}
