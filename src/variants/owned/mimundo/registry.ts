import type { SectionSlot, SectionVariant, VariantViewModule } from "@/lib/design-variants/sectionVariant";
import { mimundoSectionPropsSchema } from "@/variants/owned/mimundo/props";

const TOKENS = ["color.background", "color.foreground", "color.primary"] as const;

type LoadView = () => Promise<VariantViewModule<unknown>>;

function mimundoVariant(
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
    owner: "mimundo",
    propsSchema: mimundoSectionPropsSchema,
    editorFields: [],
    consumesTokens: TOKENS,
    interactive: Boolean(pwa),
    web,
    ...(pwa ? { pwa } : {}),
  };
}

export const MIMUNDO_VARIANTS: readonly SectionVariant<unknown>[] = [
  mimundoVariant("nav.mimundo", "nav", () =>
    import("@/variants/owned/mimundo/pieces/MiMundoSiteHeader").then((mod) => ({ default: mod.MiMundoSiteHeader })),
  ),
  mimundoVariant("hero.mimundo", "hero", () =>
    import("@/variants/owned/mimundo/pieces/MiMundoHero").then((mod) => ({ default: mod.MiMundoHero })),
  ),
  mimundoVariant("band.mimundo-propuesta", "band", () =>
    import("@/variants/owned/mimundo/pieces/MiMundoPropuestaSection").then((mod) => ({ default: mod.MiMundoPropuestaSection })),
  ),
  mimundoVariant("band.mimundo-salas", "band", () =>
    import("@/variants/owned/mimundo/pieces/MiMundoSalasGrid").then((mod) => ({ default: mod.MiMundoSalasGrid })),
  ),
  mimundoVariant("band.mimundo-gallery", "band", () =>
    import("@/variants/owned/mimundo/pieces/MiMundoLandingGallery").then((mod) => ({ default: mod.MiMundoLandingGallery })),
  ),
  mimundoVariant("contact.mimundo", "contact", () =>
    import("@/variants/owned/mimundo/pieces/MiMundoLandingContactPanel").then((mod) => ({ default: mod.MiMundoLandingContactPanel })),
  ),
  mimundoVariant(
    "page.mimundo-home",
    "page",
    () => import("@/variants/owned/mimundo/pieces/LandingMainSectionsMimundo").then((mod) => ({ default: mod.LandingMainSectionsMimundo })),
  ),
  mimundoVariant("page.mimundo-register", "page", () =>
    import("@/variants/owned/mimundo/pieces/RegisterMiMundoSurface").then((mod) => ({ default: mod.RegisterMiMundoSurface })),
  ),
  mimundoVariant("page.mimundo-contact", "page", () =>
    import("@/variants/owned/mimundo/pieces/PublicContactScreenMiMundo").then((mod) => ({ default: mod.PublicContactScreenMiMundo })),
  ),
  mimundoVariant("page.mimundo-blog", "page", () =>
    import("@/variants/owned/mimundo/pieces/PublicBlogScreenMiMundo").then((mod) => ({ default: mod.PublicBlogScreenMiMundo })),
  ),
];
