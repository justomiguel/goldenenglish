"use client";

import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { LoginScreenSkeleton } from "@/components/molecules/LoginScreenSkeleton";
import { AuthScreenDesktop } from "@/components/desktop/organisms/AuthScreenDesktop";
import { AuthScreenNarrow } from "@/components/pwa/organisms/AuthScreenNarrow";
import { ResetPasswordForm } from "@/components/organisms/ResetPasswordForm";

interface ResetPasswordScreenGateProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
}

export function ResetPasswordScreenGate({
  brand,
  dict,
  locale,
}: ResetPasswordScreenGateProps) {
  return (
    <SurfaceMountGate
      skeleton={<LoginScreenSkeleton ariaLabel={dict.common.loadingAria} />}
      desktop={
        <AuthScreenDesktop brand={brand} dict={dict} locale={locale}>
          <ResetPasswordForm labels={dict.resetPassword} locale={locale} />
        </AuthScreenDesktop>
      }
      narrow={(surface) => (
        <AuthScreenNarrow
          brand={brand}
          dict={dict}
          locale={locale}
          surface={surface}
        >
          <ResetPasswordForm labels={dict.resetPassword} locale={locale} />
        </AuthScreenNarrow>
      )}
    />
  );
}
