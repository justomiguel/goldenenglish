import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrand } from "@/lib/brand/resolvePublicBrand";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { getPublicCtaMode } from "@/lib/settings/getPublicCtaMode";
import { resolveRegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import { RegisterSurfaceByTemplate } from "@/components/organisms/RegisterSurfaceByTemplate";
import { TrialRescheduleForm } from "@/components/register/TrialRescheduleForm";
import { loadRegistrationSectionPickerOptions } from "@/lib/register/loadRegistrationSectionPickerOptions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { buildLandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ intent?: string; reschedule?: string }>;
}

export default async function RegisterPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  if (!(await getInscriptionsEnabled())) {
    redirect(`/${locale}`);
  }

  const [{ intent: requestedIntent, reschedule }, siteMode] = await Promise.all([
    searchParams,
    getPublicCtaMode(),
  ]);
  const rescheduleToken = typeof reschedule === "string" ? reschedule.trim() : "";
  const resolved = resolveRegisterIntent({
    siteMode,
    requested: requestedIntent ?? null,
  });
  if (resolved.kind === "redirect" && !rescheduleToken) {
    redirect(
      resolved.to === "trial"
        ? `/${locale}/register?intent=trial`
        : `/${locale}/register`,
    );
  }

  const [baseDict, brand, snapshot, legalAgeMajority] = await Promise.all([
    getDictionary(locale),
    resolvePublicBrand(loc),
    loadActiveTheme(),
    getLegalAgeMajorityFromSystem(),
  ]);

  const templateKind = snapshot?.theme.templateKind ?? "classic";
  const dict = applyLandingContentOverrides(
    baseDict,
    snapshot?.theme.content,
    loc,
  );

  const sectionOptions = await loadRegistrationSectionPickerOptions();

  if (rescheduleToken) {
    if (siteMode === "reserve") redirect(`/${locale}/register`);
    const supabase = await createClient();
    const { data: ok } = await supabase.rpc("registration_public_reschedule_ok", {
      p_token: rescheduleToken,
    });
    if (ok !== true) notFound();
    return (
      <TrialRescheduleForm
        locale={locale}
        token={rescheduleToken}
        dict={dict.register}
        sectionOptions={sectionOptions}
      />
    );
  }

  const mediaMap: LandingMediaMap | undefined = snapshot
    ? buildLandingMediaMap(
        snapshot.media,
        createLandingMediaPublicUrlBuilder(),
      )
    : undefined;

  const shellProps = {
    locale,
    dict,
    brand,
    legalAgeMajority,
    sectionOptions,
    intent: resolved.kind === "ok" ? resolved.intent : resolved.to,
  };

  return (
    <RegisterSurfaceByTemplate
      templateKind={templateKind}
      mediaMap={mediaMap}
      {...shellProps}
    />
  );
}
