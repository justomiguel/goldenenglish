// Canonical content model for CentroListo template skins.
// Pure module: no Supabase, no React. See docs/adr/2026-11-centrolisto-template-skins.md.

export const SKIN_SECTION_IDS = [
  "inicio", "ritmo", "historia", "oferta", "metodo", "horarios",
  "equipo", "comunidad", "admision", "faq", "contacto",
] as const;
export type SkinSectionId = (typeof SKIN_SECTION_IDS)[number];

export const SKIN_LOCALES = ["es", "en", "pt"] as const;
export type SkinLocale = (typeof SKIN_LOCALES)[number];
export type SkinLocalized = Partial<Record<SkinLocale, string>>;

export const MAX_SKIN_TEXT = 160;
export const MAX_SKIN_LONG_TEXT = 900;

export const SKIN_FIELDS = {
  inicio: ["label", "scene", "title", "body", "cta", "heroCta", "imageAlt"],
  ritmo: [],
  historia: ["label", "body"],
  oferta: ["label", "body"],
  metodo: ["label", "body"],
  horarios: ["label", "body"],
  equipo: ["label"],
  comunidad: ["label", "body", "title", "closingBody"],
  admision: ["label"],
  faq: ["label"],
  contacto: ["label", "laterTitle", "laterBody"],
} as const satisfies Record<SkinSectionId, readonly string[]>;

export const SKIN_LONG_FIELDS: ReadonlySet<string> = new Set(["body", "closingBody", "laterBody", "detail", "a"]);

export interface SkinListSpec {
  max: number;
  /** Localized text fields of one item. */
  text: readonly string[];
  /** Plain id fields of one item (not localized). */
  ids: readonly string[];
}

export const SKIN_LISTS: Partial<Record<SkinSectionId, Record<string, SkinListSpec>>> = {
  ritmo: { lines: { max: 6, text: ["text"], ids: [] } },
  historia: { manifesto: { max: 6, text: ["text"], ids: [] } },
  oferta: { items: { max: 12, text: ["name", "line", "detail"], ids: ["id"] } },
  metodo: { pillars: { max: 6, text: ["title", "line"], ids: [] } },
  horarios: {
    levels: { max: 6, text: ["label"], ids: ["id"] },
    slots: { max: 40, text: ["when", "place"], ids: ["itemId", "levelId"] },
  },
  equipo: { people: { max: 12, text: ["name", "role", "line"], ids: [] } },
  admision: { steps: { max: 6, text: ["title", "line"], ids: [] } },
  faq: { entries: { max: 12, text: ["q", "a"], ids: [] } },
};

/** Primary list per section. An empty primary list hides the section. */
export const SKIN_PRIMARY_LIST: Partial<Record<SkinSectionId, string>> = {
  ritmo: "lines",
  oferta: "items",
  metodo: "pillars",
  horarios: "slots",
  equipo: "people",
  admision: "steps",
  faq: "entries",
};

export const SKIN_PHOTO_SLOT: Partial<Record<SkinSectionId, string>> = {
  inicio: "inicio::1",
  historia: "historia::1",
  oferta: "oferta::1",
  metodo: "modalidades::1",
  horarios: "niveles::1",
  comunidad: "certificaciones::1",
};

export type StoredSkinItem = Record<string, string | SkinLocalized>;

export interface SkinContentV1 {
  v: 1;
  sections: Partial<Record<SkinSectionId, {
    fields?: Record<string, SkinLocalized>;
    lists?: Record<string, StoredSkinItem[]>;
  }>>;
}

export interface ResolvedSkin {
  inicio: { label: string; scene: string; title: string; body: string; cta: string; heroCta: string; imageAlt: string };
  ritmo: { lines: { text: string }[] };
  historia: { label: string; body: string; manifesto: { text: string }[] };
  oferta: { label: string; body: string; items: { id: string; name: string; line: string; detail: string }[] };
  metodo: { label: string; body: string; pillars: { title: string; line: string }[] };
  horarios: {
    label: string;
    body: string;
    levels: { id: string; label: string }[];
    slots: { itemId: string; levelId: string; when: string; place: string }[];
  };
  equipo: { label: string; people: { name: string; role: string; line: string }[] };
  comunidad: { label: string; body: string; title: string; closingBody: string };
  admision: { label: string; steps: { title: string; line: string }[] };
  faq: { label: string; entries: { q: string; a: string }[] };
  contacto: { label: string; laterTitle: string; laterBody: string };
}
