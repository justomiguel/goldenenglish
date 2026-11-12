import type { SectionSlot, SectionVariant, VariantViewModule } from "@/lib/design-variants/sectionVariant";
import { mozarthitosSectionPropsSchema } from "@/variants/owned/mozarthitos/props";

const TOKENS = ["color.background", "color.foreground", "color.primary"] as const;

type LoadView = () => Promise<VariantViewModule<unknown>>;

function mozarthitosVariant(
  id: string,
  slot: SectionSlot,
  web: LoadView,
  pwa?: LoadView,
): SectionVariant<unknown> {
  return {
    id,
    slot,
    major: 1,
    patch: 0,
    owner: "mozarthitos",
    propsSchema: mozarthitosSectionPropsSchema,
    editorFields: [],
    consumesTokens: TOKENS,
    interactive: Boolean(pwa),
    web,
    ...(pwa ? { pwa } : {}),
  };
}

export const MOZARTHITOS_VARIANTS: readonly SectionVariant<unknown>[] = [
  mozarthitosVariant("nav.mozarthitos", "nav", () =>
    import("@/components/organisms/MozarthitosSiteHeader").then((mod) => ({ default: mod.MozarthitosSiteHeader })),
  ),
  mozarthitosVariant("band.mozarthitos-body", "band", () =>
    import("@/components/organisms/LandingMozarthitosSections").then((mod) => ({ default: mod.LandingMozarthitosSections })),
  ),
  mozarthitosVariant("band.mozarthitos-cursos", "band", () =>
    import("@/components/organisms/LandingMozarthitosCursosSection").then((mod) => ({
      default: mod.LandingMozarthitosCursosSection,
    })),
  ),
  mozarthitosVariant("band.mozarthitos-sedes", "band", () =>
    import("@/components/organisms/LandingMozarthitosSedesSection").then((mod) => ({
      default: mod.LandingMozarthitosSedesSection,
    })),
  ),
  mozarthitosVariant("contact.mozarthitos", "contact", () =>
    import("@/components/organisms/LandingMozarthitosContactSection").then((mod) => ({
      default: mod.LandingMozarthitosContactSection,
    })),
  ),
  mozarthitosVariant(
    "page.mozarthitos-home",
    "page",
    () => import("@/variants/owned/mozarthitos/home/v1/Web"),
    () => import("@/variants/owned/mozarthitos/home/v1/Pwa"),
  ),
  mozarthitosVariant("page.mozarthitos-register", "page", () =>
    import("@/components/organisms/RegisterMozarthitosSurface").then((mod) => ({ default: mod.RegisterMozarthitosSurface })),
  ),
  mozarthitosVariant("page.mozarthitos-contact", "page", () =>
    import("@/components/organisms/PublicContactScreenMozarthitos").then((mod) => ({
      default: mod.PublicContactScreenMozarthitos,
    })),
  ),
  mozarthitosVariant("page.mozarthitos-blog", "page", () =>
    import("@/components/organisms/PublicBlogScreenMozarthitos").then((mod) => ({ default: mod.PublicBlogScreenMozarthitos })),
  ),
  mozarthitosVariant("page.find-class", "page", () =>
    import("@/components/desktop/organisms/FamilyGuideDesktop").then((mod) => ({
      default: mod.FamilyGuideDesktop,
    })),
  ),
];
