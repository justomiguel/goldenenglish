import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { defaultLocale, getDictionary, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { getBrandForRequest } from "@/lib/brand/server";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import { loadRequestSessionEmail } from "@/lib/auth/loadRequestSessionEmail";
import { buildResolvedPublicShareMetadata } from "@/lib/site/buildResolvedPublicShareMetadata";
import { MZ_GUIDE_PATH, readGuideAnswers } from "@/lib/landing/mozarthitos/guideToken";
import { PublicExperienceShell } from "@/components/organisms/PublicExperienceShell";
import { PublicBlogScreenMozarthitos } from "@/components/organisms/PublicBlogScreenMozarthitos";
import { MozarthitosFamilyGuideEntry } from "@/components/organisms/MozarthitosFamilyGuideEntry";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function guidePath(locale: string): string {
  return `/${locale}/${MZ_GUIDE_PATH}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const snapshot = await loadActiveTheme();
  if (snapshot?.theme.templateKind !== "mozarthitos") return {};
  const [baseDict, brand] = await Promise.all([getDictionary(locale), getBrandForRequest()]);
  const guide = applyLandingContentOverrides(baseDict, snapshot.theme.content, locale).landing.mz
    .guide;
  const path = guidePath(locale);
  const meta = await buildResolvedPublicShareMetadata({
    what: guide.metaTitle,
    academyName: brand.name,
    description: guide.metaDescription,
    path,
  });
  return {
    ...meta,
    alternates: {
      canonical: path,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, guidePath(l)])),
        "x-default": guidePath(defaultLocale),
      },
    },
  };
}

export default async function MozarthitosFamilyGuidePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const [query, snapshot, resolved, blogEnabled, merchEnabled, sessionEmail] = await Promise.all([
    searchParams,
    loadActiveTheme(),
    resolvePublicBrandWithSetup(loc),
    loadBlogEnabled(),
    loadMerchEnabled(),
    loadRequestSessionEmail(),
  ]);
  if (snapshot?.theme.templateKind !== "mozarthitos") notFound();

  const dict = applyLandingContentOverrides(resolved.dict, snapshot.theme.content, loc);
  const mz = dict.landing.mz;
  const guide = mz.guide;

  return (
    <PublicExperienceShell
      locale={loc}
      dict={dict}
      templateKind="mozarthitos"
      sessionEmail={sessionEmail}
    >
      <PublicBlogScreenMozarthitos
        locale={loc}
        dict={dict}
        brand={resolved.brand}
        sessionEmail={sessionEmail}
        blogEnabled={blogEnabled}
        merchEnabled={merchEnabled}
        blogLabel={dict.blog.list.title}
        eventsLabel={dict.events.public.title}
      >
        <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-10 sm:px-6 lg:pt-16">
          <header className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {guide.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-muted-foreground)]">
              {guide.lead}
            </p>
          </header>
          <div className="mt-8">
            <MozarthitosFamilyGuideEntry
              locale={loc}
              labels={guide}
              place={`${mz.sede.title} · ${mz.sede.subtitle}`}
              initial={readGuideAnswers(query)}
            />
          </div>
        </div>
      </PublicBlogScreenMozarthitos>
    </PublicExperienceShell>
  );
}
