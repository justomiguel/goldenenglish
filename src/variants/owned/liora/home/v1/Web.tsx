"use client";

import { LandingLioraSections } from "@/components/organisms/LandingLioraSections";
import { LioraRibbonOverlay } from "@/components/organisms/LioraRibbonOverlay";
import { LioraSiteHeader } from "@/components/organisms/LioraSiteHeader";
import type { LioraHomeProps } from "@/variants/owned/liora/home/v1/hostProps";

export function LandingLioraExperience({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
  blogEnabled,
  merchEnabled,
  publicCtaMode,
  inscriptionsEnabled,
  eventsLabel,
  blogLabel,
  shopLabel,
  labels,
}: LioraHomeProps) {
  return (
    <main className="relative overflow-x-clip">
      <LioraSiteHeader
        locale={locale}
        brandName={brand.name}
        logoAlt={brand.logoAlt}
        dict={dict}
        sessionEmail={sessionEmail ?? null}
        showBlogLink={blogEnabled}
        blogLabel={blogLabel}
        showShopLink={merchEnabled}
        shopLabel={shopLabel}
        showEventsLink
        eventsLabel={eventsLabel}
        instagramUrl={brand.socialInstagram}
        whatsappUrl={brand.socialWhatsapp}
        labels={labels}
      />
      <LandingLioraSections
        dict={dict}
        brand={brand}
        locale={locale}
        mediaMap={mediaMap}
        publicCtaMode={publicCtaMode}
        inscriptionsEnabled={inscriptionsEnabled}
        sessionEmail={sessionEmail}
      />
      <LioraRibbonOverlay />
    </main>
  );
}

export default LandingLioraExperience;
