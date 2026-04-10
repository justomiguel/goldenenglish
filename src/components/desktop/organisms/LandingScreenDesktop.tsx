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
}

export function LandingScreenDesktop({
  brand,
  dict,
  locale,
  sessionEmail,
  children,
}: LandingScreenDesktopProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <LandingHeader
        brand={brand}
        dict={dict}
        locale={locale}
        sessionEmail={sessionEmail}
      />
      {children}
      <LandingFooter
        dict={dict}
        brand={brand}
        locale={locale}
        sessionEmail={sessionEmail}
      />
    </div>
  );
}
