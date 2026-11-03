import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingScreenDesktop } from "@/components/desktop/organisms/LandingScreenDesktop";
import { LandingMainSectionsGeneric } from "@/components/organisms/LandingMainSectionsGeneric";
import { brandPublicFromProperties } from "@/lib/brand/server";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { centrolistoPrivatePageMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import {
  genericKindColorOverrides,
  genericStockPath,
  isGenericInstituteKind,
} from "@/lib/theme/genericInstituteTemplates";
import { parseTemplatePalette, templatePaletteOverrides } from "@/lib/theme/templatePalette";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import { cssRootBlock, mergeProperties } from "@/lib/theme/themeOverrides";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; kind: string }>;
}): Promise<Metadata> {
  const { locale, kind } = await params;
  if (!isGenericInstituteKind(kind)) return {};
  const { dict } = await loadCentrolistoDictionary(locale, {});
  const name = dict.landing.genericLandings[kind].name;
  return centrolistoPrivatePageMetadata({
    locale,
    title: name,
    description: dict.landing.genericLandings[kind].title,
    siteName: dict.pulsar.meta.brandName,
    suffix: `/plantilla/${kind}`,
  });
}

export default async function GenericTemplatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; kind: string }>;
  searchParams: Promise<{ primary?: string; accent?: string; paper?: string }>;
}) {
  const { locale, kind } = await params;
  if (!isGenericInstituteKind(kind) || !(await isPulsarPlatformRequest())) notFound();
  const dict = await getDictionary(locale as AppLocale);
  const copy = dict.landing.genericLandings[kind];
  const chosen = parseTemplatePalette(await searchParams);
  const properties = mergeProperties(
    SYSTEM_PROPERTIES_DEFAULTS,
    chosen ? templatePaletteOverrides(chosen) : genericKindColorOverrides(kind),
  );
  const brand = {
    ...brandPublicFromProperties(properties),
    name: copy.name,
    legalName: copy.name,
    tagline: copy.title,
    taglineEn: copy.title,
    legalRegistry: "",
    logoPath: genericStockPath(kind, "favicon.png"),
    logoAlt: copy.name,
    faviconPath: genericStockPath(kind, "favicon.png"),
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    socialFacebook: "",
    socialInstagram: "",
    socialWhatsapp: "",
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssRootBlock(properties) }} />
      <LandingScreenDesktop brand={brand} dict={dict} locale={locale} sessionEmail={null}>
        <LandingMainSectionsGeneric
          copy={copy}
          locale={locale}
          kind={kind}
          sectionLabels={dict.landing.genericSectionLabels}
          contactLabels={dict.landing.genericContact}
        />
      </LandingScreenDesktop>
    </>
  );
}
