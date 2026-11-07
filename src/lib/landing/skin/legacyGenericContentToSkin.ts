import type { SiteThemeContent } from "@/types/theming";
import type { SkinContentV1, SkinLocalized, SkinSectionId, StoredSkinItem } from "@/lib/landing/skin/skinModel";

const PAGE_FIELDS: Record<string, [SkinSectionId, string]> = {
  scene: ["inicio", "scene"],
  title: ["inicio", "title"],
  body: ["inicio", "body"],
  cta: ["inicio", "cta"],
  heroCta: ["inicio", "heroCta"],
  imageAlt: ["inicio", "imageAlt"],
  laterTitle: ["contacto", "laterTitle"],
  laterBody: ["contacto", "laterBody"],
  "sections.historia": ["historia", "body"],
  "sections.oferta": ["oferta", "body"],
  "sections.modalidades": ["metodo", "body"],
  "sections.niveles": ["horarios", "body"],
  "sections.certificaciones": ["comunidad", "body"],
};

const LABELS: Record<string, SkinSectionId> = {
  inicio: "inicio",
  historia: "historia",
  oferta: "oferta",
  modalidades: "metodo",
  niveles: "horarios",
  certificaciones: "comunidad",
  equipo: "equipo",
  contacto: "contacto",
};

const RHYTHM = ["rhythmA", "rhythmB", "rhythmC"] as const;
const GENERIC_KEY = /^genericLandings\.[a-z0-9]+\.(.+)$/;
const LABEL_KEY = /^genericSectionLabels\.([a-z]+)$/;

function isLocalized(value: unknown): value is SkinLocalized {
  return !!value && typeof value === "object" && Object.values(value).some((v) => typeof v === "string" && v.trim());
}

/** Maps pre-skin generic landing copy (SiteThemeContent) to the canonical skin model. */
export function legacyGenericContentToSkin(content: SiteThemeContent | null | undefined): SkinContentV1 {
  const out: SkinContentV1 = { v: 1, sections: {} };
  const setField = (section: SkinSectionId, field: string, value: SkinLocalized) => {
    const current = out.sections[section] ?? {};
    out.sections[section] = { ...current, fields: { ...current.fields, [field]: value } };
  };
  const lines: StoredSkinItem[] = [];
  for (const section of Object.values(content ?? {})) {
    for (const [key, value] of Object.entries(section ?? {})) {
      if (!isLocalized(value)) continue;
      const label = LABEL_KEY.exec(key)?.[1];
      if (label && Object.hasOwn(LABELS, label)) {
        setField(LABELS[label], "label", value);
        continue;
      }
      const rest = GENERIC_KEY.exec(key)?.[1];
      if (!rest) continue;
      const rhythm = RHYTHM.indexOf(rest as (typeof RHYTHM)[number]);
      if (rhythm >= 0) {
        lines[rhythm] = { text: value };
        continue;
      }
      if (Object.hasOwn(PAGE_FIELDS, rest)) {
        const [section, field] = PAGE_FIELDS[rest];
        setField(section, field, value);
      }
    }
  }
  if (lines.length) {
    out.sections.ritmo = { lists: { lines: Array.from(lines, (line) => line ?? {}) } };
  }
  return out;
}
