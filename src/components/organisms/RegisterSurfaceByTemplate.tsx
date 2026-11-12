import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import { RegisterClassicSurface } from "@/components/organisms/RegisterClassicSurface";
import { renderOwnedSurface } from "@/variants/ownedSurfaces";
import type { RegisterExtrasPack } from "@/lib/register/packs/registerExtrasPack";
import type { RegisterSectionMode } from "@/lib/settings/registerSectionMode";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import type { MzGuideChoice } from "@/lib/landing/mozarthitos/familyGuideCatalog";

interface RegisterSurfaceByTemplateProps {
  templateKind: string;
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  mediaMap?: LandingMediaMap;
  enrollmentLink?: SectionEnrollmentLinkContext;
  intent?: RegisterIntent;
  sessionEmail?: string | null;
  sectionMode?: RegisterSectionMode;
  /** Mozarthitos family guide choice from `?guide=`; other templates ignore it. */
  guide?: MzGuideChoice | null;
  extrasPack?: RegisterExtrasPack | null;
}

/**
 * Single source of truth for which registration surface a tenant gets.
 * Shared by `/[locale]/register` and `/[locale]/i/[token]` so a new tenant
 * surface serves both routes at once (rule 28-tenant-register-surface).
 */
export function RegisterSurfaceByTemplate({
  templateKind,
  mediaMap,
  guide = null,
  extrasPack = null,
  ...shellProps
}: RegisterSurfaceByTemplateProps) {
  const withPack = { ...shellProps, extrasPack };
  const owned = renderOwnedSurface("register", templateKind, { ...withPack, mediaMap, guide });
  if (owned) return owned;
  return <RegisterClassicSurface {...withPack} />;
}
