import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LandingHeader } from "@/components/organisms/LandingHeader";
import { LandingFooter } from "@/components/organisms/LandingFooter";

interface LandingScreenDesktopProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  children: ReactNode;
  /** When true, the template renders its own primary navigation (e.g. Mozarthitos). */
  suppressHeader?: boolean;
  /** Pie acorde a plantilla Mozarthitos (`landing.mz.footerCta`). */
  mozarthitosShell?: boolean;
}

export function LandingScreenDesktop({
  brand,
  dict,
  locale,
  sessionEmail,
  children,
  suppressHeader = false,
  mozarthitosShell = false,
}: LandingScreenDesktopProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {suppressHeader ? null : (
        <LandingHeader
          brand={brand}
          dict={dict}
          locale={locale}
          sessionEmail={sessionEmail}
        />
      )}
      {children}
      <LandingFooter
        dict={dict}
        brand={brand}
        locale={locale}
        sessionEmail={sessionEmail}
        mozarthitosShell={mozarthitosShell}
      />
    </div>
  );
}
