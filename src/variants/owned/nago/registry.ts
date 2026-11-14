import type { SectionSlot, SectionVariant, VariantViewModule } from "@/lib/design-variants/sectionVariant";
import { nagoSectionPropsSchema } from "@/variants/owned/nago/props";

const TOKENS = ["color.background", "color.foreground", "color.primary"] as const;

type LoadView = () => Promise<VariantViewModule<unknown>>;

function nagoVariant(id: string, slot: SectionSlot, web: LoadView): SectionVariant<unknown> {
  return {
    id,
    slot,
    major: 1,
    patch: 0,
    owner: "nago",
    propsSchema: nagoSectionPropsSchema,
    editorFields: [],
    consumesTokens: TOKENS,
    interactive: false,
    web,
  };
}

export const NAGO_VARIANTS: readonly SectionVariant<unknown>[] = [
  nagoVariant("nav.nago", "nav", () =>
    import("@/variants/owned/nago/pieces/NagoSiteHeader").then((mod) => ({ default: mod.NagoSiteHeader })),
  ),
  nagoVariant("band.nago-body", "band", () =>
    import("@/variants/owned/nago/pieces/LandingNagoSections").then((mod) => ({ default: mod.LandingNagoSections })),
  ),
  nagoVariant("page.nago-home", "page", () =>
    import("@/variants/owned/nago/pieces/LandingMainSectionsNago").then((mod) => ({ default: mod.LandingMainSectionsNago })),
  ),
  nagoVariant("page.nago-register", "page", () =>
    import("@/variants/owned/nago/pieces/RegisterNagoSurface").then((mod) => ({ default: mod.RegisterNagoSurface })),
  ),
  nagoVariant("page.nago-contact", "page", () =>
    import("@/variants/owned/nago/pieces/PublicContactScreenNago").then((mod) => ({ default: mod.PublicContactScreenNago })),
  ),
  nagoVariant("page.nago-blog", "page", () =>
    import("@/variants/owned/nago/pieces/PublicBlogScreenNago").then((mod) => ({ default: mod.PublicBlogScreenNago })),
  ),
];
