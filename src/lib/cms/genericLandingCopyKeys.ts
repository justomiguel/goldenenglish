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

const RHYTHM_FIELDS = ["rhythmA", "rhythmB", "rhythmC"] as const;

const LABEL_SECTIONS = ["historia", "oferta", "modalidades", "niveles", "certificaciones"] as const;

const NAME_KEYS = [
  "genericSectionLabels.inicio",
  "genericSectionLabels.equipo",
  "genericSectionLabels.contacto",
] as const;

export function genericLandingCopyKeys(
  kind: GenericInstituteKind,
  section: LandingSectionSlug,
): readonly string[] {
  if (section === "inicio") {
    return [
      ...PAGE_FIELDS.map((field) => `genericLandings.${kind}.${field}`),
      ...RHYTHM_FIELDS.map((field) => `genericLandings.${kind}.${field}`),
      ...NAME_KEYS,
    ];
  }
  if ((LABEL_SECTIONS as readonly string[]).includes(section)) {
    return [
      `genericSectionLabels.${section}`,
      `genericLandings.${kind}.sections.${section}`,
    ];
  }
  return [];
}

const PAGE_FIELD = [...PAGE_FIELDS, ...RHYTHM_FIELDS].join("|");
const KIND = GENERIC_INSTITUTE_KINDS.join("|");
const LABEL = [...LABEL_SECTIONS, "inicio", "equipo", "contacto"].join("|");
const GENERIC_COPY_KEY = new RegExp(
  `^(?:genericLandings\\.(?:${KIND})\\.(?:${PAGE_FIELD}|sections\\.(?:${LABEL}))|genericSectionLabels\\.(?:${LABEL}))$`,
);

export function isGenericLandingCopyKey(path: string): boolean {
  return GENERIC_COPY_KEY.test(path);
}
