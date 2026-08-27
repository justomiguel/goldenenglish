import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import { RegisterClassicSurface } from "@/components/organisms/RegisterClassicSurface";
import { RegisterEspacioZenitSurface } from "@/components/organisms/RegisterEspacioZenitSurface";
import { RegisterLioraSurface } from "@/components/organisms/RegisterLioraSurface";
import { RegisterMiMundoSurface } from "@/components/organisms/RegisterMiMundoSurface";
import { RegisterMozarthitosSurface } from "@/components/organisms/RegisterMozarthitosSurface";
import { RegisterNagoSurface } from "@/components/organisms/RegisterNagoSurface";
import { extrasPackForTemplateKind } from "@/lib/register/packs/extrasPackForTemplateKind";

interface RegisterSurfaceByTemplateProps {
  templateKind: string;
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  mediaMap?: LandingMediaMap;
  enrollmentLink?: SectionEnrollmentLinkContext;
}

/**
 * Single source of truth for which registration surface a tenant gets.
 * Shared by `/[locale]/register` and `/[locale]/i/[token]` so a new tenant
 * surface serves both routes at once (rule 28-tenant-register-surface).
 */
export function RegisterSurfaceByTemplate({
  templateKind,
  mediaMap,
  ...shellProps
}: RegisterSurfaceByTemplateProps) {
  const extrasPack = extrasPackForTemplateKind(templateKind);
  const withPack = { ...shellProps, extrasPack };
  if (templateKind === "espaciozenit") {
    return <RegisterEspacioZenitSurface {...withPack} mediaMap={mediaMap} />;
  }
  if (templateKind === "mozarthitos") {
    return <RegisterMozarthitosSurface {...withPack} mediaMap={mediaMap} />;
  }
  if (templateKind === "nago") {
    return <RegisterNagoSurface {...withPack} />;
  }
  if (templateKind === "mimundo") {
    return <RegisterMiMundoSurface {...withPack} />;
  }
  if (templateKind === "liora") {
    return <RegisterLioraSurface {...withPack} />;
  }
  return <RegisterClassicSurface {...withPack} />;
}
