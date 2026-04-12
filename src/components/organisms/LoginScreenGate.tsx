"use client";

import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { LoginScreenNarrow } from "@/components/pwa/organisms/LoginScreenNarrow";
import { LoginScreenSkeleton } from "@/components/molecules/LoginScreenSkeleton";

interface LoginScreenGateProps {
  desktop: ReactNode;
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  nextPath?: string | null;
}

export function LoginScreenGate({
  desktop,
  brand,
  dict,
  locale,
  nextPath = null,
}: LoginScreenGateProps) {
  return (
    <SurfaceMountGate
      skeleton={<LoginScreenSkeleton ariaLabel={dict.common.loadingAria} />}
      desktop={desktop}
      narrow={(surface) => (
        <LoginScreenNarrow
          brand={brand}
          dict={dict}
          locale={locale}
          nextPath={nextPath}
          surface={surface}
        />
      )}
    />
  );
}
