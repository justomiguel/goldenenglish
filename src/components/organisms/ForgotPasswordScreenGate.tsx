"use client";

import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { LoginScreenSkeleton } from "@/components/molecules/LoginScreenSkeleton";
import { AuthScreenDesktop } from "@/components/desktop/organisms/AuthScreenDesktop";
import { AuthScreenNarrow } from "@/components/pwa/organisms/AuthScreenNarrow";
import { ForgotPasswordForm } from "@/components/organisms/ForgotPasswordForm";

interface ForgotPasswordScreenGateProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
}

export function ForgotPasswordScreenGate({
  brand,
  dict,
  locale,
}: ForgotPasswordScreenGateProps) {
  return (
    <SurfaceMountGate
      skeleton={<LoginScreenSkeleton ariaLabel={dict.common.loadingAria} />}
      desktop={
        <AuthScreenDesktop brand={brand} dict={dict} locale={locale}>
          <ForgotPasswordForm labels={dict.forgotPassword} locale={locale} />
        </AuthScreenDesktop>
      }
      narrow={(surface) => (
        <AuthScreenNarrow
          brand={brand}
          dict={dict}
          locale={locale}
          surface={surface}
        >
          <ForgotPasswordForm labels={dict.forgotPassword} locale={locale} />
        </AuthScreenNarrow>
      )}
    />
  );
}
