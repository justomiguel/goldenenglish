import type { ReactNode } from "react";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LandingHeader } from "@/components/organisms/LandingHeader";
import { LandingFooter } from "@/components/organisms/LandingFooter";

interface LandingScreenDesktopProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  blogEnabled?: boolean;
  children: ReactNode;
  /** When true, the template renders its own primary navigation (e.g. Mozarthitos). */
  suppressHeader?: boolean;
  /** Pie acorde a plantillas marketing (`landing.mz|ez.footerCta`). */
  marketingFullBleedShell?: boolean;
  marketingLandingFooterBrand?: MarketingLandingBrand;
  /** Plantilla incluye su propio footer (p. ej. espaciozenit mock). */
  suppressMarketingShellFooter?: boolean;
}

export function LandingScreenDesktop({
  brand,
  dict,
  locale,
  sessionEmail,
  blogEnabled = false,
  children,
  suppressHeader = false,
  marketingFullBleedShell = false,
  marketingLandingFooterBrand,
  suppressMarketingShellFooter = false,
}: LandingScreenDesktopProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {suppressHeader ? null : (
        <LandingHeader
          brand={brand}
          dict={dict}
          locale={locale}
          sessionEmail={sessionEmail}
          blogEnabled={blogEnabled}
        />
      )}
      {children}
      {suppressMarketingShellFooter ? null : (
        <LandingFooter
          dict={dict}
          brand={brand}
          locale={locale}
          sessionEmail={sessionEmail}
          marketingFullBleedShell={marketingFullBleedShell}
          marketingLandingFooterBrand={marketingLandingFooterBrand}
        />
      )}
    </div>
  );
}
