"use client";

import type { ReactNode } from "react";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { LandingScreenDesktop } from "@/components/desktop/organisms/LandingScreenDesktop";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { LandingHeaderPwa } from "@/components/pwa/molecules/LandingHeaderPwa";
import { LandingFooterPwa } from "@/components/pwa/molecules/LandingFooterPwa";

interface LandingSurfaceGateProps {
  main: ReactNode;
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  /** Template supplies its own top navigation on every surface. */
  suppressPwaHeader?: boolean;
  /** Same meaning as `LandingScreenDesktop.suppressHeader`. */
  suppressHeader?: boolean;
  blogEnabled?: boolean;
  /** Pie PWA alineado a plantillas marketing full-bleed. */
  marketingFullBleedShell?: boolean;
  marketingLandingFooterBrand?: MarketingLandingBrand;
  suppressMarketingShellFooter?: boolean;
}

export function LandingSurfaceGate({
  main,
  brand,
  dict,
  locale,
  sessionEmail,
  suppressPwaHeader = false,
  suppressHeader = false,
  blogEnabled = false,
  marketingFullBleedShell = false,
  marketingLandingFooterBrand,
  suppressMarketingShellFooter = false,
}: LandingSurfaceGateProps) {
  const desktop = (
    <LandingScreenDesktop
      brand={brand}
      dict={dict}
      locale={locale}
      sessionEmail={sessionEmail}
      blogEnabled={blogEnabled}
      suppressHeader={suppressHeader}
      suppressMarketingShellFooter={suppressMarketingShellFooter}
      marketingFullBleedShell={marketingFullBleedShell}
      marketingLandingFooterBrand={marketingLandingFooterBrand}
    >
      {main}
    </LandingScreenDesktop>
  );

  return (
    <SurfaceMountGate
      skeleton={desktop}
      desktop={desktop}
      narrow={(surface) => (
        <PwaPageShell surface={surface}>
          <div className="flex min-h-dvh flex-col bg-[var(--color-background)]">
            {suppressPwaHeader ? null : (
              <LandingHeaderPwa
                brand={brand}
                dict={dict}
                locale={locale}
                sessionEmail={sessionEmail}
              />
            )}
            <div className="flex-1">{main}</div>
            {suppressMarketingShellFooter ? null : (
              <LandingFooterPwa
                dict={dict}
                brand={brand}
                locale={locale}
                sessionEmail={sessionEmail}
                marketingFullBleedShell={marketingFullBleedShell}
                marketingLandingFooterBrand={marketingLandingFooterBrand}
              />
            )}
          </div>
        </PwaPageShell>
      )}
    />
  );
}
