import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JsonLdFaqPage } from "@/components/molecules/JsonLdFaqPage";
import { PublicAnswerSurfaceByTemplate } from "@/components/organisms/PublicAnswerSurfaceByTemplate";
import { PublicExperienceShell } from "@/components/organisms/PublicExperienceShell";
import { loadRequestSessionEmail } from "@/lib/auth/loadRequestSessionEmail";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { buildLocalePageAlternates } from "@/lib/metadata/buildHomePageMetadata";
import { instituteAnswerKindKey, withPublishableContact } from "@/lib/public/instituteAnswerPages";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (await isPulsarPlatformRequest()) {
    return { robots: { index: false, follow: false } };
  }
  const { locale } = await params;
  const loc = locale as AppLocale;
  const [dict, snapshot] = await Promise.all([getDictionary(loc), loadActiveTheme()]);
  const kind = instituteAnswerKindKey(snapshot?.theme.templateKind ?? "classic");
  const copy = dict.publicAnswers.kinds[kind];
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: buildLocalePageAlternates(locale, "/preguntas"),
    robots: { index: true, follow: true },
  };
}

export default async function PublicAnswersPage({ params }: PageProps) {
  if (await isPulsarPlatformRequest()) {
    notFound();
  }
  const { locale } = await params;
  const loc = locale as AppLocale;
  const [{ brand, needsInitialSiteSetup, dict: baseDict }, snapshot, sessionEmail] = await Promise.all([
    resolvePublicBrandWithSetup(loc),
    loadActiveTheme(),
    loadRequestSessionEmail(),
  ]);
  if (needsInitialSiteSetup) {
    redirect(`/${locale}`);
  }
  const dict = applyLandingContentOverrides(baseDict, snapshot?.theme.content, loc);
  const templateKind = snapshot?.theme.templateKind ?? "classic";
  const kind = instituteAnswerKindKey(templateKind);
  const copy = dict.publicAnswers.kinds[kind];
  const answers = dict.publicAnswers;
  const items = withPublishableContact({
    items: copy.items,
    brand: brand.name,
    contactQuestion: answers.contactQuestion,
    contactLine: answers.contactLine,
    contactEmailOnly: answers.contactEmailOnly,
    contactPhoneOnly: answers.contactPhoneOnly,
    email: brand.contactEmail,
    phone: brand.contactPhone,
  });
  const lead = answers.lead.replaceAll("{{brand}}", brand.name.trim());

  return (
    <PublicExperienceShell locale={locale} dict={dict} templateKind={templateKind} sessionEmail={sessionEmail}>
      <PublicAnswerSurfaceByTemplate
        templateKind={templateKind}
        locale={locale}
        dict={dict}
        brand={brand}
        sessionEmail={sessionEmail}
        title={answers.pageTitle}
        lead={lead}
        items={items}
      />
      <JsonLdFaqPage items={items} />
    </PublicExperienceShell>
  );
}
