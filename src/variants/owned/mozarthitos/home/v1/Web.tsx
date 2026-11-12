"use client";

import { LandingMozarthitosSections } from "@/components/organisms/LandingMozarthitosSections";
import { MozarthitosSiteHeader } from "@/components/organisms/MozarthitosSiteHeader";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import type { MozarthitosHomeProps } from "@/variants/owned/mozarthitos/home/v1/hostProps";

export function LandingMozarthitosExperience({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
  blogEnabled,
  merchEnabled,
  eventsLabel,
  blogLabel,
  shopLabel,
  labels,
}: MozarthitosHomeProps) {
  const logoSrc = resolveLandingImageSrcForTheme("mozarthitos", "inicio", "1.png", mediaMap);
  return (
    <main className="relative overflow-x-hidden">
      <MozarthitosSiteHeader
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={brand.logoAlt}
        logoWidth={1024}
        logoHeight={303}
        dict={dict}
        sessionEmail={sessionEmail ?? null}
        showBlogLink={blogEnabled}
        blogLabel={blogLabel}
        showShopLink={merchEnabled}
        shopLabel={shopLabel}
        showEventsLink
        eventsLabel={eventsLabel}
        labels={labels}
      />
      <LandingMozarthitosSections dict={dict} locale={locale} mediaMap={mediaMap} />
    </main>
  );
}

export default LandingMozarthitosExperience;
