import type { LandingSectionSlug } from "@/types/theming";
import {
  GENERIC_INSTITUTE_KINDS,
  type GenericInstituteKind,
} from "@/lib/theme/genericInstituteTemplates";

const PAGE_FIELDS = [
  "scene",
  "title",
  "body",
  "imageAlt",
  "laterTitle",
  "laterBody",
  "cta",
] as const;

const LABEL_SECTIONS = ["historia", "oferta", "modalidades", "niveles", "certificaciones"] as const;

export function genericLandingCopyKeys(
  kind: GenericInstituteKind,
  section: LandingSectionSlug,
): readonly string[] {
  if (section === "inicio") {
    return PAGE_FIELDS.map((field) => `genericLandings.${kind}.${field}`);
  }
  if ((LABEL_SECTIONS as readonly string[]).includes(section)) {
    return [`genericSectionLabels.${section}`];
  }
  return [];
}

const PAGE_FIELD = PAGE_FIELDS.join("|");
const KIND = GENERIC_INSTITUTE_KINDS.join("|");
const LABEL = LABEL_SECTIONS.join("|");
const GENERIC_COPY_KEY = new RegExp(
  `^(?:genericLandings\\.(?:${KIND})\\.(?:${PAGE_FIELD})|genericSectionLabels\\.(?:${LABEL}))$`,
);

export function isGenericLandingCopyKey(path: string): boolean {
  return GENERIC_COPY_KEY.test(path);
}
