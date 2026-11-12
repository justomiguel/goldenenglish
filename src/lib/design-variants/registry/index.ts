import { BAND_VARIANTS } from "@/lib/design-variants/registry/band";
import { CLOSE_VARIANTS } from "@/lib/design-variants/registry/close";
import { CONTACT_VARIANTS } from "@/lib/design-variants/registry/contact";
import { FOOTER_VARIANTS } from "@/lib/design-variants/registry/footer";
import { HERO_VARIANTS } from "@/lib/design-variants/registry/hero";
import { ESPACIOZENIT_VARIANTS } from "@/variants/owned/espaciozenit/registry";
import { NAGO_VARIANTS } from "@/variants/owned/nago/registry";
import { LIORA_VARIANTS } from "@/variants/owned/liora/registry";
import { MATISS_VARIANTS } from "@/variants/owned/matiss/registry";
import { MIMUNDO_VARIANTS } from "@/variants/owned/mimundo/registry";
import { MOZARTHITOS_VARIANTS } from "@/variants/owned/mozarthitos/registry";
import { NAV_VARIANTS } from "@/lib/design-variants/registry/nav";
import { PAGE_VARIANTS } from "@/lib/design-variants/registry/page";
import { SCHEDULE_VARIANTS } from "@/lib/design-variants/registry/schedule";
import type { SectionVariant } from "@/lib/design-variants/sectionVariant";

export const ALL_VARIANTS: readonly SectionVariant<unknown>[] = [
  ...HERO_VARIANTS,
  ...SCHEDULE_VARIANTS,
  ...BAND_VARIANTS,
  ...CLOSE_VARIANTS,
  ...NAV_VARIANTS,
  ...PAGE_VARIANTS,
  ...FOOTER_VARIANTS,
  ...CONTACT_VARIANTS,
  ...MATISS_VARIANTS,
  ...LIORA_VARIANTS,
  ...MOZARTHITOS_VARIANTS,
  ...MIMUNDO_VARIANTS,
  ...ESPACIOZENIT_VARIANTS,
  ...NAGO_VARIANTS,
];
