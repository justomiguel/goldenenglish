"use client";

import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { LandingScreenSkeleton } from "@/components/molecules/LandingScreenSkeleton";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { LandingGreenfieldHeader } from "@/components/organisms/LandingGreenfieldHeader";
import { LandingGreenfieldFooter } from "@/components/organisms/LandingGreenfieldFooter";

interface LandingGreenfieldSurfaceGateProps {
  main: ReactNode;
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  /** Sin admins: sin CTA en header (el único paso es el botón del cuerpo). */
  bootstrapAccountPending?: boolean;
}

export function LandingGreenfieldSurfaceGate({
  main,
  brand,
  dict,
  locale,
  sessionEmail,
  bootstrapAccountPending = false,
}: LandingGreenfieldSurfaceGateProps) {
  const shellProps = {
    brand,
    dict,
    locale,
    sessionEmail,
    bootstrapAccountPending,
  };

  return (
    <SurfaceMountGate
      skeleton={<LandingScreenSkeleton ariaLabel={dict.common.loadingAria} />}
      desktop={
        <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
          <LandingGreenfieldHeader {...shellProps} />
          <div className="flex flex-1 flex-col">{main}</div>
          <LandingGreenfieldFooter dict={dict} brand={brand} />
        </div>
      }
      narrow={(surface) => (
        <PwaPageShell surface={surface}>
          <div className="flex min-h-dvh flex-col bg-[var(--color-background)]">
            <LandingGreenfieldHeader {...shellProps} />
            <div className="flex flex-1 flex-col">{main}</div>
            <LandingGreenfieldFooter dict={dict} brand={brand} />
          </div>
        </PwaPageShell>
      )}
    />
  );
}
