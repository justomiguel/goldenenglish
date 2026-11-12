import type { SectionSlot, SectionVariant, VariantViewModule } from "@/lib/design-variants/sectionVariant";
import { espaciozenitSectionPropsSchema } from "@/variants/owned/espaciozenit/props";

const TOKENS = ["color.background", "color.foreground", "color.primary"] as const;

type LoadView = () => Promise<VariantViewModule<unknown>>;

function espaciozenitVariant(id: string, slot: SectionSlot, web: LoadView): SectionVariant<unknown> {
  return {
    id,
    slot,
    major: 1,
    patch: 0,
    owner: "espaciozenit",
    propsSchema: espaciozenitSectionPropsSchema,
    editorFields: [],
    consumesTokens: TOKENS,
    interactive: false,
    web,
  };
}

export const ESPACIOZENIT_VARIANTS: readonly SectionVariant<unknown>[] = [
  espaciozenitVariant("nav.espaciozenit", "nav", () =>
    import("@/components/organisms/EspacioZenitSiteHeader").then((mod) => ({ default: mod.EspacioZenitSiteHeader })),
  ),
  espaciozenitVariant("band.espaciozenit-body", "band", () =>
    import("@/components/organisms/LandingEspacioZenitSections").then((mod) => ({ default: mod.LandingEspacioZenitSections })),
  ),
  espaciozenitVariant("footer.espaciozenit", "footer", () =>
    import("@/components/organisms/LandingEspacioZenitFooter").then((mod) => ({ default: mod.LandingEspacioZenitFooter })),
  ),
  espaciozenitVariant("page.espaciozenit-home", "page", () =>
    import("@/components/organisms/LandingMainSectionsEspacioZenit").then((mod) => ({
      default: mod.LandingMainSectionsEspacioZenit,
    })),
  ),
  espaciozenitVariant("page.espaciozenit-register", "page", () =>
    import("@/components/organisms/RegisterEspacioZenitSurface").then((mod) => ({ default: mod.RegisterEspacioZenitSurface })),
  ),
  espaciozenitVariant("page.espaciozenit-contact", "page", () =>
    import("@/components/organisms/PublicContactScreenEspacioZenit").then((mod) => ({
      default: mod.PublicContactScreenEspacioZenit,
    })),
  ),
  espaciozenitVariant("page.espaciozenit-blog", "page", () =>
    import("@/components/organisms/PublicBlogScreenEspacioZenit").then((mod) => ({ default: mod.PublicBlogScreenEspacioZenit })),
  ),
];
