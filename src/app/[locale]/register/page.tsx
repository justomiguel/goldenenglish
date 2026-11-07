import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrand } from "@/lib/brand/resolvePublicBrand";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { getInscriptionsEnabled, getRegisterSectionMode } from "@/lib/settings/inscriptionsServer";
import { getPublicCtaMode } from "@/lib/settings/getPublicCtaMode";
import { resolveRegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import { RegisterSurfaceByTemplate } from "@/components/organisms/RegisterSurfaceByTemplate";
import { PublicExperienceShell } from "@/components/organisms/PublicExperienceShell";
import { TrialRescheduleForm } from "@/components/register/TrialRescheduleForm";
import { loadRegistrationSectionPickerOptions } from "@/lib/register/loadRegistrationSectionPickerOptions";
import { createClient } from "@/lib/supabase/server";
import { loadRequestSessionEmail } from "@/lib/auth/loadRequestSessionEmail";
import { notFound } from "next/navigation";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { buildLandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { createRequestLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import {
  formatGuideToken,
  MZ_GUIDE_REGISTER_PARAM,
  parseGuideToken,
} from "@/lib/landing/mozarthitos/guideToken";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ intent?: string; reschedule?: string; guide?: string }>;
}

export default async function RegisterPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  if (!(await getInscriptionsEnabled())) {
    redirect(`/${locale}`);
  }

  const [{ intent: requestedIntent, reschedule, guide: rawGuide }, siteMode] = await Promise.all([
    searchParams,
    getPublicCtaMode(),
  ]);
  const rescheduleToken = typeof reschedule === "string" ? reschedule.trim() : "";
  const guide = parseGuideToken(rawGuide);
  const resolved = resolveRegisterIntent({
    siteMode,
    requested: requestedIntent ?? null,
  });
  if (resolved.kind === "redirect" && !rescheduleToken) {
    const query = new URLSearchParams();
    if (resolved.to === "trial") query.set("intent", "trial");
    if (guide) query.set(MZ_GUIDE_REGISTER_PARAM, formatGuideToken(guide));
    const qs = query.toString();
    redirect(`/${locale}/register${qs ? `?${qs}` : ""}`);
  }

  const [baseDict, brand, snapshot, legalAgeMajority, sessionEmail, sectionMode] =
    await Promise.all([
      getDictionary(locale),
      resolvePublicBrand(loc),
      loadActiveTheme(),
      getLegalAgeMajorityFromSystem(),
      loadRequestSessionEmail(),
      getRegisterSectionMode(),
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
      <PublicExperienceShell
        locale={locale}
        dict={dict}
        templateKind={templateKind}
        sessionEmail={sessionEmail}
      >
        <TrialRescheduleForm
          locale={locale}
          token={rescheduleToken}
          dict={dict.register}
          sectionOptions={sectionOptions}
        />
      </PublicExperienceShell>
    );
  }

  const mediaMap: LandingMediaMap | undefined = snapshot
    ? buildLandingMediaMap(
        snapshot.media,
        await createRequestLandingMediaPublicUrlBuilder(),
      )
    : undefined;

  const shellProps = {
    locale,
    dict,
    brand,
    legalAgeMajority,
    sectionOptions,
    intent: resolved.kind === "ok" ? resolved.intent : resolved.to,
    sessionEmail,
    sectionMode,
  };

  return (
    <PublicExperienceShell
      locale={locale}
      dict={dict}
      templateKind={templateKind}
      sessionEmail={sessionEmail}
    >
      <RegisterSurfaceByTemplate
        templateKind={templateKind}
        mediaMap={mediaMap}
        guide={guide}
        {...shellProps}
      />
    </PublicExperienceShell>
  );
}
