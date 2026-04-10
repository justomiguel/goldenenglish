"use client";

import type { ReactNode } from "react";
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
}

export function LandingSurfaceGate({
  desktop,
  main,
  brand,
  dict,
  locale,
  sessionEmail,
}: LandingSurfaceGateProps) {
  return (
    <SurfaceMountGate
      skeleton={<LandingScreenSkeleton />}
      desktop={desktop}
      narrow={(surface) => (
        <PwaPageShell surface={surface}>
          <div className="flex min-h-dvh flex-col bg-[var(--color-background)]">
            <LandingHeaderPwa
              brand={brand}
              dict={dict}
              locale={locale}
              sessionEmail={sessionEmail}
            />
            <div className="flex-1">{main}</div>
            <LandingFooterPwa
              dict={dict}
              brand={brand}
              locale={locale}
              sessionEmail={sessionEmail}
            />
          </div>
        </PwaPageShell>
      )}
    />
  );
}
