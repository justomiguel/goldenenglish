"use client";

import type { ReactNode } from "react";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { LandingScreenSkeleton } from "@/components/molecules/LandingScreenSkeleton";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { LandingHeaderPwa } from "@/components/pwa/molecules/LandingHeaderPwa";
import { LandingFooterPwa } from "@/components/pwa/molecules/LandingFooterPwa";

interface LandingSurfaceGateProps {
  desktop: ReactNode;
  main: ReactNode;
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  /** Template supplies its own top navigation on every surface. */
  suppressPwaHeader?: boolean;
  /** Pie PWA alineado a plantillas marketing full-bleed. */
  marketingFullBleedShell?: boolean;
  marketingLandingFooterBrand?: MarketingLandingBrand;
  suppressMarketingShellFooter?: boolean;
}

export function LandingSurfaceGate({
  desktop,
  main,
  brand,
  dict,
  locale,
  sessionEmail,
  suppressPwaHeader = false,
  marketingFullBleedShell = false,
  marketingLandingFooterBrand,
  suppressMarketingShellFooter = false,
}: LandingSurfaceGateProps) {
  return (
    <SurfaceMountGate
      skeleton={<LandingScreenSkeleton ariaLabel={dict.common.loadingAria} />}
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
