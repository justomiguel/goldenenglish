import type { SectionSlot, SectionVariant, VariantViewModule } from "@/lib/design-variants/sectionVariant";
import { matissSectionPropsSchema } from "@/variants/owned/matiss/props";

const TOKENS = ["color.background", "color.foreground", "color.primary"] as const;

type LoadView = () => Promise<VariantViewModule<unknown>>;

function matissVariant(
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
    owner: "matiss",
    propsSchema: matissSectionPropsSchema,
    editorFields: [],
    consumesTokens: TOKENS,
    interactive: Boolean(pwa),
    web,
    ...(pwa ? { pwa } : {}),
  };
}

export const MATISS_VARIANTS: readonly SectionVariant<unknown>[] = [
  matissVariant("nav.matiss", "nav", () => import("@/variants/owned/matiss/header/v1/Web"), () => import("@/variants/owned/matiss/header/v1/Pwa")),
  matissVariant("hero.matiss", "hero", () => import("@/variants/owned/matiss/hero/v1/Web")),
  matissVariant("band.matiss-manifesto", "band", () => import("@/variants/owned/matiss/manifesto/v1/Web")),
  matissVariant("band.matiss-benefits", "band", () => import("@/variants/owned/matiss/benefits/v1/Web")),
  matissVariant("band.matiss-programs", "band", () => import("@/variants/owned/matiss/programs/v1/Web")),
  matissVariant("schedule.matiss-age", "schedule", () => import("@/variants/owned/matiss/age/v1/Web"), () => import("@/variants/owned/matiss/age/v1/Pwa")),
  matissVariant("band.matiss-class-day", "band", () => import("@/variants/owned/matiss/class-day/v1/Web")),
  matissVariant("band.matiss-first-class", "band", () => import("@/variants/owned/matiss/first-class/v1/Web")),
  matissVariant("band.matiss-gala", "band", () => import("@/variants/owned/matiss/gala/v1/Web")),
  matissVariant("band.matiss-gallery", "band", () => import("@/variants/owned/matiss/gallery/v1/Web"), () => import("@/variants/owned/matiss/gallery/v1/Pwa")),
  matissVariant("band.matiss-locations", "band", () => import("@/variants/owned/matiss/locations/v1/Web")),
  matissVariant("faq.matiss", "faq", () => import("@/variants/owned/matiss/faq/v1/Web")),
  matissVariant("faq.matiss-phone", "faq", () => import("@/variants/owned/matiss/faq-phone/v1/Web"), () => import("@/variants/owned/matiss/faq-phone/v1/Pwa")),
  matissVariant("contact.matiss", "contact", () => import("@/variants/owned/matiss/contact/v1/Web"), () => import("@/variants/owned/matiss/contact/v1/Pwa")),
  matissVariant("footer.matiss", "footer", () => import("@/variants/owned/matiss/footer/v1/Web")),
  matissVariant("page.matiss-home", "page", () => import("@/variants/owned/matiss/home/v1/Web"), () => import("@/variants/owned/matiss/home/v1/Pwa")),
  matissVariant("page.matiss-register", "page", () => import("@/variants/owned/matiss/register/v1/Web"), () => import("@/variants/owned/matiss/register/v1/Pwa")),
  matissVariant("page.matiss-contact", "page", () => import("@/variants/owned/matiss/contact-page/v1/Web"), () => import("@/variants/owned/matiss/contact-page/v1/Pwa")),
  matissVariant("page.matiss-blog", "page", () => import("@/variants/owned/matiss/blog/v1/Web")),
];
