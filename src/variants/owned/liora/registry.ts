import type { SectionSlot, SectionVariant, VariantViewModule } from "@/lib/design-variants/sectionVariant";
import { lioraSectionPropsSchema } from "@/variants/owned/liora/props";

const TOKENS = ["color.background", "color.foreground", "color.primary"] as const;

type LoadView = () => Promise<VariantViewModule<unknown>>;

function lioraVariant(
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
    owner: "liora",
    propsSchema: lioraSectionPropsSchema,
    editorFields: [],
    consumesTokens: TOKENS,
    interactive: Boolean(pwa),
    web,
    ...(pwa ? { pwa } : {}),
  };
}

export const LIORA_VARIANTS: readonly SectionVariant<unknown>[] = [
  lioraVariant("nav.liora", "nav", () =>
    import("@/components/organisms/LioraSiteHeader").then((mod) => ({ default: mod.LioraSiteHeader })),
  ),
  lioraVariant("hero.liora", "hero", () =>
    import("@/components/organisms/LandingLioraHero").then((mod) => ({ default: mod.LandingLioraHero })),
  ),
  lioraVariant("band.liora-sobre", "band", () =>
    import("@/components/organisms/LandingLioraSobre").then((mod) => ({ default: mod.LandingLioraSobre })),
  ),
  lioraVariant("band.liora-clases", "band", () =>
    import("@/components/organisms/LandingLioraClasesSection").then((mod) => ({ default: mod.LandingLioraClasesSection })),
  ),
  lioraVariant("band.liora-sedes", "band", () =>
    import("@/components/organisms/LandingLioraSedesSection").then((mod) => ({ default: mod.LandingLioraSedesSection })),
  ),
  lioraVariant("schedule.liora-horarios", "schedule", () =>
    import("@/components/organisms/LandingLioraHorariosSection").then((mod) => ({ default: mod.LandingLioraHorariosSection })),
  ),
  lioraVariant("band.liora-gallery", "band", () =>
    import("@/components/organisms/LioraLandingGallery").then((mod) => ({ default: mod.LioraLandingGallery })),
  ),
  lioraVariant("contact.liora", "contact", () =>
    import("@/components/organisms/LioraLandingContactPanel").then((mod) => ({ default: mod.LioraLandingContactPanel })),
  ),
  lioraVariant("footer.liora", "footer", () =>
    import("@/components/organisms/LandingLioraFooter").then((mod) => ({ default: mod.LandingLioraFooter })),
  ),
  lioraVariant(
    "page.liora-home",
    "page",
    () => import("@/variants/owned/liora/home/v1/Web"),
    () => import("@/variants/owned/liora/home/v1/Pwa"),
  ),
  lioraVariant("page.liora-register", "page", () =>
    import("@/components/organisms/RegisterLioraSurface").then((mod) => ({ default: mod.RegisterLioraSurface })),
  ),
  lioraVariant("page.liora-contact", "page", () =>
    import("@/components/organisms/PublicContactScreenLiora").then((mod) => ({ default: mod.PublicContactScreenLiora })),
  ),
  lioraVariant("page.liora-blog", "page", () =>
    import("@/components/organisms/PublicBlogScreenLiora").then((mod) => ({ default: mod.PublicBlogScreenLiora })),
  ),
];
