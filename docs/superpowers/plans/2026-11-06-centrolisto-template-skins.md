# CentroListo template skins — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-06-centrolisto-template-skins-design.md`

**Goal:** The 10 CentroListo templates become skins over one editable content model. The owner (own site only) and CentroListo staff can switch skins with a live preview. Owner text, photos, and colors survive a switch.

**Architecture:** A pure module `src/lib/landing/skin/` defines the canonical model, the Zod schemas, the legacy mapper, and the resolver. A new column `site_themes.skin_content` stores owner values. A skin change only updates `site_themes.template_kind` on the row that `brandThemeSlug` points to. One renderer (`LandingMainSectionsGeneric`) composes per-section variant components. A skin definition picks the variants. A shared mobile tree renders on `web-mobile` / `pwa-mobile`.

**Tech Stack:** Next.js App Router, React, Tailwind, CSS modules, Zod, Supabase (shared-schema tenants), Vitest + Testing Library.

## Global Constraints

- Scope: only `GENERIC_INSTITUTE_KINDS`. Do not change institute templates.
- Trunk-based: work on `main`. No branches, no worktrees, no stash.
- Max 250 lines per file (rule 03). One main component per file.
- No Supabase client outside `src/lib/supabase/` (rule 12). Pure modules import no Supabase and no React.
- Copy in `src/dictionaries/en.json`, `es.json`, `pt.json`. Spanish is neutral tuteo (rule 40).
- Migrations are additive (rule 21). Qualify objects with `public.`. Apply with `npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/<file>.sql` (rule 45).
- Every server failure logs with `[ge:server]` helpers (rule 25).
- Mutations: `revalidatePath` on the server and `router.refresh()` in the hook (rule 27).
- Buttons carry a leading Lucide icon (rule 16). No `alert`/`confirm`/`prompt` (rule 18).
- Uploads keep `InlineUploadProgressBar` (rule 48).
- Motion: CSS only, `cubic-bezier(0.22, 1, 0.36, 1)`, disabled under `prefers-reduced-motion: reduce`.
- Tests are self-contained (rule 30). Add a `// REGRESSION CHECK:` note in touched test files (rule 02).
- Commits: the first commit holds spec + plan + Phase 1. Each later phase is one commit. Add a changelog entry in `src/lib/product-changelog/catalog.ts` with the first product-visible commit (rule 39). If the precommit gate fails, ask the user before changing tests or code (rule 990).
- Manual QA is user-owned (rule 32).

## File structure

| Path | Responsibility | Phase |
|---|---|---|
| `supabase/migrations/266_site_themes_skin_content.sql` | New column `skin_content` | 1 |
| `src/lib/landing/skin/skinModel.ts` | Section ids, field lists, list specs, limits, types | 1 |
| `src/lib/landing/skin/skinContentSchema.ts` | Zod: tolerant parse of stored JSON, strict section patch | 1 |
| `src/lib/landing/skin/legacyGenericContentToSkin.ts` | Map legacy `content` keys to the canonical model | 1 |
| `src/lib/landing/skin/resolveSkin.ts` | Owner value, else skin default, per locale | 1 |
| `src/lib/landing/skin/skinPalette.ts` | Palette swap on a skin change | 1 |
| `src/lib/landing/skin/skinDefinitions.ts` | Kind → section variants + motion preset | 2 |
| `src/lib/pulsar/siteSkinStore.ts` | Server adapter: read and write `template_kind`, `skin_content`, `properties` | 3 |
| `src/app/[locale]/admin/tenants/[slug]/theme/skinActions.ts` | `changeSiteSkinAction`, `saveSiteSkinSectionAction`, `saveSiteSkinPaletteAction` | 3, 4 |
| `src/components/organisms/skin/*` | Section variant components (web) | 2 |
| `src/components/pwa/organisms/skin/*` | Shared mobile tree | 5 |
| `src/components/organisms/pulsar/skin/*` | Skin picker, preview bar, list editor, palette editor | 3, 4 |
| `src/hooks/useSiteSkin.ts`, `src/hooks/useSiteSkinSection.ts` | Client orchestration | 3, 4 |
| `docs/adr/2026-11-centrolisto-template-skins.md` | ADR | 1 |

---

## Phase 1 — Content model, persistence, resolver

### Task 1: ADR

**Files:**
- Create: `docs/adr/2026-11-centrolisto-template-skins.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 2026-11 — CentroListo template skins

## Context
CentroListo free sites use 10 generic templates. Each template is a separate `site_themes` row (`generic-<kind>`). Owner text uses keys that contain the kind. Photos are keyed by `theme_id`. A template change points `brand_theme_slug` to another row. The owner loses text, photos, and colors. List content (team, schedule, FAQ) is fixed in the dictionaries.

## Decision
- One canonical content model for all 10 kinds, stored in `site_themes.skin_content` (JSONB, versioned `v: 1`).
- A skin change updates only `site_themes.template_kind` on the row that `brand_theme_slug` points to.
- Resolution: owner value if set, else the active skin default from the dictionaries.
- Legacy owner text is read through a pure mapper. No SQL backfill.
- Write access: CentroListo staff (`platform_staff`) for any site; the owner for their own site (`platform_tenant_owners`). Checked with `resolvePulsarSiteActor`.
- Audit rows in `platform_audit_log`: `tenant.skin_change`, `tenant.skin_content_save`, `tenant.skin_palette_save`.

## Options considered
- Store lists inside `site_themes.content`. Rejected: `content` is `section → key → LocalizedCopy` and is cleaned for institute templates too.
- Copy text and media to the new `generic-<kind>` row on a switch. Rejected: two sources of truth, media copy in Storage, partial-failure risk.
- SQL backfill of legacy keys. Rejected: a read-time mapper has the same effect, no data risk, and Vitest coverage.

## Consequences
- Tests: schema, mapper, resolver, palette swap, actions (authz, validation, audit).
- The `generic-<kind>` slug of a row no longer tells the active skin. Read `template_kind`.
- Finer staff roles are a later change.
```

### Task 2: Migration `skin_content`

**Files:**
- Create: `supabase/migrations/266_site_themes_skin_content.sql`
- Modify: `supabase/migrations/masterdb.sql` (after the `template_kind` block, about line 5400)

- [ ] **Step 1: Confirm the next free number**

Run: `ls supabase/migrations | sort -n | tail -3`
Expected: last file is `265_register_section_mode.sql`. If a higher number exists, use the next one and rename everywhere in this plan.

- [ ] **Step 2: Write the migration**

```sql
-- CentroListo skins: one editable content model for generic templates.
-- Additive. No data rewrite. See docs/adr/2026-11-centrolisto-template-skins.md.

ALTER TABLE public.site_themes
  ADD COLUMN IF NOT EXISTS skin_content JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.site_themes.skin_content IS
  'Owner values for CentroListo skins: { "v": 1, "sections": { <sectionId>: { "fields": {...}, "lists": {...} } } }. Empty object means skin defaults.';
```

- [ ] **Step 3: Mirror in `masterdb.sql`**

Add the same `ALTER TABLE … ADD COLUMN` and `COMMENT` after the `template_kind` comment.

- [ ] **Step 4: Apply to all tenants**

Run: `npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/266_site_themes_skin_content.sql`
Expected: one success line per target. Shared-schema targets show `tenant_<slug>`. No `unqualified_public` error.

### Task 3: Canonical model

**Files:**
- Create: `src/lib/landing/skin/skinModel.ts`
- Test: `src/__tests__/lib/landing/skin/skinModel.test.ts`

**Interfaces:**
- Produces: `SKIN_SECTION_IDS`, `SkinSectionId`, `SKIN_LOCALES`, `SkinLocale`, `SKIN_FIELDS`, `SKIN_LISTS`, `SkinListSpec`, `SKIN_PHOTO_SLOT`, `ResolvedSkin`, `SkinContentV1`, `SkinLocalized`, `StoredSkinItem`, `MAX_SKIN_TEXT`, `MAX_SKIN_LONG_TEXT`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  SKIN_FIELDS,
  SKIN_LISTS,
  SKIN_PHOTO_SLOT,
  SKIN_SECTION_IDS,
} from "@/lib/landing/skin/skinModel";

// REGRESSION CHECK: renaming a section id or field breaks stored skin_content and every skin renderer.
describe("skinModel", () => {
  it("lists the 11 canonical sections in render order", () => {
    expect(SKIN_SECTION_IDS).toEqual([
      "inicio", "ritmo", "historia", "oferta", "metodo", "horarios",
      "equipo", "comunidad", "admision", "faq", "contacto",
    ]);
  });

  it("gives every section a label field", () => {
    for (const id of SKIN_SECTION_IDS) {
      if (id === "ritmo") continue;
      expect(SKIN_FIELDS[id]).toContain("label");
    }
  });

  it("caps every list", () => {
    expect(SKIN_LISTS.oferta?.items.max).toBe(12);
    expect(SKIN_LISTS.horarios?.slots.max).toBe(40);
    expect(SKIN_LISTS.faq?.entries.max).toBe(12);
  });

  it("keeps the existing photo slot keys", () => {
    expect(SKIN_PHOTO_SLOT.metodo).toBe("modalidades::1");
    expect(SKIN_PHOTO_SLOT.comunidad).toBe("certificaciones::1");
    expect(SKIN_PHOTO_SLOT.equipo).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/landing/skin/skinModel.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
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

export const SKIN_LONG_FIELDS: ReadonlySet<string> = new Set(["body", "closingBody", "laterBody"]);

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
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/__tests__/lib/landing/skin/skinModel.test.ts`
Expected: PASS.

### Task 4: Zod schemas

**Files:**
- Create: `src/lib/landing/skin/skinContentSchema.ts`
- Test: `src/__tests__/lib/landing/skin/skinContentSchema.test.ts`

**Interfaces:**
- Consumes: Task 3 exports.
- Produces: `parseSkinContent(raw: unknown): SkinContentV1` (tolerant, never throws). `parseSkinSectionPatch(section: SkinSectionId, raw: unknown): { ok: true; value: NonNullable<SkinContentV1["sections"][SkinSectionId]> } | { ok: false; code: "invalid_input" | "list_too_long" | "text_too_long" }` (strict).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { parseSkinContent, parseSkinSectionPatch } from "@/lib/landing/skin/skinContentSchema";

// REGRESSION CHECK: parseSkinContent must never throw; a malformed row must not break the public site.
describe("parseSkinContent", () => {
  it("returns an empty v1 model for junk", () => {
    expect(parseSkinContent(null)).toEqual({ v: 1, sections: {} });
    expect(parseSkinContent("x")).toEqual({ v: 1, sections: {} });
    expect(parseSkinContent({ v: 2 })).toEqual({ v: 1, sections: {} });
  });

  it("drops unknown sections, fields, and lists", () => {
    const parsed = parseSkinContent({
      v: 1,
      sections: {
        inicio: { fields: { title: { es: "Hola" }, hack: { es: "x" } } },
        nope: { fields: { title: { es: "x" } } },
        oferta: { lists: { items: [{ id: "a", name: { es: "Fútbol" } }], other: [] } },
      },
    });
    expect(parsed.sections).toEqual({
      inicio: { fields: { title: { es: "Hola" } } },
      oferta: { lists: { items: [{ id: "a", name: { es: "Fútbol" } }] } },
    });
  });

  it("trims lists to their maximum", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ q: { es: `q${i}` }, a: { es: "a" } }));
    const parsed = parseSkinContent({ v: 1, sections: { faq: { lists: { entries: items } } } });
    expect(parsed.sections.faq?.lists?.entries).toHaveLength(12);
  });
});

describe("parseSkinSectionPatch", () => {
  it("accepts a valid patch", () => {
    const result = parseSkinSectionPatch("faq", {
      fields: { label: { es: "Preguntas" } },
      lists: { entries: [{ q: { es: "¿Hay prueba?" }, a: { es: "Sí." } }] },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a list over the maximum", () => {
    const entries = Array.from({ length: 13 }, () => ({ q: { es: "q" }, a: { es: "a" } }));
    expect(parseSkinSectionPatch("faq", { lists: { entries } })).toEqual({ ok: false, code: "list_too_long" });
  });

  it("rejects text over the limit", () => {
    expect(parseSkinSectionPatch("inicio", { fields: { title: { es: "x".repeat(161) } } }))
      .toEqual({ ok: false, code: "text_too_long" });
  });

  it("rejects unknown keys", () => {
    expect(parseSkinSectionPatch("inicio", { fields: { hack: { es: "x" } } }))
      .toEqual({ ok: false, code: "invalid_input" });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/landing/skin/skinContentSchema.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
import { z } from "zod";
import {
  MAX_SKIN_LONG_TEXT,
  MAX_SKIN_TEXT,
  SKIN_FIELDS,
  SKIN_LISTS,
  SKIN_LOCALES,
  SKIN_LONG_FIELDS,
  SKIN_SECTION_IDS,
  type SkinContentV1,
  type SkinLocalized,
  type SkinSectionId,
  type StoredSkinItem,
} from "@/lib/landing/skin/skinModel";

type SectionValue = NonNullable<SkinContentV1["sections"][SkinSectionId]>;

function maxFor(field: string): number {
  return SKIN_LONG_FIELDS.has(field) || field === "detail" || field === "a" ? MAX_SKIN_LONG_TEXT : MAX_SKIN_TEXT;
}

function looseLocalized(raw: unknown, max: number): SkinLocalized | null {
  if (!raw || typeof raw !== "object") return null;
  const out: SkinLocalized = {};
  for (const locale of SKIN_LOCALES) {
    const value = (raw as Record<string, unknown>)[locale];
    if (typeof value === "string" && value.trim()) out[locale] = value.trim().slice(0, max);
  }
  return Object.keys(out).length ? out : null;
}

function looseItem(raw: unknown, text: readonly string[], ids: readonly string[]): StoredSkinItem | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const item: StoredSkinItem = {};
  for (const key of ids) {
    const value = obj[key];
    if (typeof value === "string" && /^[a-z0-9-]{1,40}$/.test(value)) item[key] = value;
  }
  for (const key of text) {
    const value = looseLocalized(obj[key], maxFor(key));
    if (value) item[key] = value;
  }
  return Object.keys(item).length ? item : null;
}

export function parseSkinContent(raw: unknown): SkinContentV1 {
  const empty: SkinContentV1 = { v: 1, sections: {} };
  if (!raw || typeof raw !== "object" || (raw as { v?: unknown }).v !== 1) return empty;
  const sectionsRaw = (raw as { sections?: unknown }).sections;
  if (!sectionsRaw || typeof sectionsRaw !== "object") return empty;
  const sections: SkinContentV1["sections"] = {};
  for (const id of SKIN_SECTION_IDS) {
    const sectionRaw = (sectionsRaw as Record<string, unknown>)[id];
    if (!sectionRaw || typeof sectionRaw !== "object") continue;
    const value: SectionValue = {};
    const fieldsRaw = (sectionRaw as { fields?: Record<string, unknown> }).fields ?? {};
    const fields: Record<string, SkinLocalized> = {};
    for (const field of SKIN_FIELDS[id]) {
      const localized = looseLocalized(fieldsRaw[field], maxFor(field));
      if (localized) fields[field] = localized;
    }
    if (Object.keys(fields).length) value.fields = fields;
    const listsRaw = (sectionRaw as { lists?: Record<string, unknown> }).lists ?? {};
    const lists: Record<string, StoredSkinItem[]> = {};
    for (const [name, spec] of Object.entries(SKIN_LISTS[id] ?? {})) {
      const listRaw = listsRaw[name];
      if (!Array.isArray(listRaw)) continue;
      lists[name] = listRaw
        .map((item) => looseItem(item, spec.text, spec.ids))
        .filter((item): item is StoredSkinItem => item !== null)
        .slice(0, spec.max);
    }
    if (Object.keys(lists).length) value.lists = lists;
    if (value.fields || value.lists) sections[id] = value;
  }
  return { v: 1, sections };
}

function strictLocalized(max: number) {
  return z
    .object(Object.fromEntries(SKIN_LOCALES.map((l) => [l, z.string().trim().max(max, "text_too_long").optional()])))
    .strict();
}

function sectionPatchSchema(section: SkinSectionId) {
  const fieldShape = Object.fromEntries(SKIN_FIELDS[section].map((f) => [f, strictLocalized(maxFor(f)).optional()]));
  const listShape = Object.fromEntries(
    Object.entries(SKIN_LISTS[section] ?? {}).map(([name, spec]) => {
      const itemShape = {
        ...Object.fromEntries(spec.ids.map((k) => [k, z.string().regex(/^[a-z0-9-]{1,40}$/)])),
        ...Object.fromEntries(spec.text.map((k) => [k, strictLocalized(maxFor(k)).optional()])),
      };
      return [name, z.array(z.object(itemShape).strict()).max(spec.max, "list_too_long").optional()];
    }),
  );
  return z.object({ fields: z.object(fieldShape).strict().optional(), lists: z.object(listShape).strict().optional() }).strict();
}

export function parseSkinSectionPatch(
  section: SkinSectionId,
  raw: unknown,
): { ok: true; value: SectionValue } | { ok: false; code: "invalid_input" | "list_too_long" | "text_too_long" } {
  const parsed = sectionPatchSchema(section).safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data as SectionValue };
  const messages = parsed.error.issues.map((issue) => issue.message);
  if (messages.includes("list_too_long")) return { ok: false, code: "list_too_long" };
  if (messages.includes("text_too_long")) return { ok: false, code: "text_too_long" };
  return { ok: false, code: "invalid_input" };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/__tests__/lib/landing/skin/skinContentSchema.test.ts`
Expected: PASS. If the file exceeds 250 lines, move `looseLocalized` / `looseItem` to `skinContentLoose.ts`.

### Task 5: Legacy mapper

**Files:**
- Create: `src/lib/landing/skin/legacyGenericContentToSkin.ts`
- Test: `src/__tests__/lib/landing/skin/legacyGenericContentToSkin.test.ts`

**Interfaces:**
- Consumes: `SkinContentV1`, `SiteThemeContent` (`@/types/theming`).
- Produces: `legacyGenericContentToSkin(content: SiteThemeContent | null | undefined): SkinContentV1`.

Mapping (any kind prefix `genericLandings.<k>.`):

| Legacy key | Canonical |
|---|---|
| `scene`, `title`, `body`, `cta`, `heroCta`, `imageAlt` | `inicio.fields.*` |
| `rhythmA`, `rhythmB`, `rhythmC` | `ritmo.lists.lines[0..2].text` |
| `sections.historia` | `historia.fields.body` |
| `sections.oferta` | `oferta.fields.body` |
| `sections.modalidades` | `metodo.fields.body` |
| `sections.niveles` | `horarios.fields.body` |
| `sections.certificaciones` | `comunidad.fields.body` |
| `laterTitle`, `laterBody` | `contacto.fields.laterTitle`, `contacto.fields.laterBody` |
| `genericSectionLabels.inicio` | `inicio.fields.label` |
| `genericSectionLabels.historia` / `oferta` | same section `label` |
| `genericSectionLabels.modalidades` | `metodo.fields.label` |
| `genericSectionLabels.niveles` | `horarios.fields.label` |
| `genericSectionLabels.certificaciones` | `comunidad.fields.label` |
| `genericSectionLabels.equipo` | `equipo.fields.label` |
| `genericSectionLabels.contacto` | `contacto.fields.label` |

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { legacyGenericContentToSkin } from "@/lib/landing/skin/legacyGenericContentToSkin";

// REGRESSION CHECK: this mapper is the only path for pre-skin owner text. Do not drop a row of the mapping table.
describe("legacyGenericContentToSkin", () => {
  it("maps hero text from any kind prefix", () => {
    const skin = legacyGenericContentToSkin({
      inicio: {
        "genericLandings.jardin.title": { es: "Un jardín", en: "A garden" },
        "genericLandings.jardin.rhythmB": { es: "10:00. Juego" },
      },
    });
    expect(skin.sections.inicio?.fields?.title).toEqual({ es: "Un jardín", en: "A garden" });
    expect(skin.sections.ritmo?.lists?.lines).toEqual([{}, { text: { es: "10:00. Juego" } }]);
  });

  it("maps section bodies and labels to the canonical section", () => {
    const skin = legacyGenericContentToSkin({
      modalidades: {
        "genericSectionLabels.modalidades": { es: "Método" },
        "genericLandings.deportes.sections.modalidades": { es: "Entrenamos así." },
      },
    });
    expect(skin.sections.metodo?.fields).toEqual({ label: { es: "Método" }, body: { es: "Entrenamos así." } });
  });

  it("ignores keys outside the mapping", () => {
    expect(legacyGenericContentToSkin({ inicio: { "hero.kicker": { es: "x" } } })).toEqual({ v: 1, sections: {} });
  });

  it("returns an empty model for no content", () => {
    expect(legacyGenericContentToSkin(null)).toEqual({ v: 1, sections: {} });
  });
});
```

Rhythm lines keep their position. A missing earlier position is an empty object, so `rhythmB` stays the second line. Trailing positions are not added.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/landing/skin/legacyGenericContentToSkin.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
import type { SiteThemeContent } from "@/types/theming";
import type { SkinContentV1, SkinLocalized, SkinSectionId } from "@/lib/landing/skin/skinModel";

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

export function legacyGenericContentToSkin(content: SiteThemeContent | null | undefined): SkinContentV1 {
  const out: SkinContentV1 = { v: 1, sections: {} };
  const setField = (section: SkinSectionId, field: string, value: SkinLocalized) => {
    const current = out.sections[section] ?? {};
    out.sections[section] = { ...current, fields: { ...current.fields, [field]: value } };
  };
  const lines: Array<{ text?: SkinLocalized }> = [];
  for (const section of Object.values(content ?? {})) {
    for (const [key, value] of Object.entries(section ?? {})) {
      if (!isLocalized(value)) continue;
      const label = LABEL_KEY.exec(key)?.[1];
      if (label && LABELS[label]) {
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
      const target = PAGE_FIELDS[rest];
      if (target) setField(target[0], target[1], value);
    }
  }
  if (lines.length) {
    out.sections.ritmo = { lists: { lines: Array.from(lines, (line) => line ?? {}) as never } };
  }
  return out;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/__tests__/lib/landing/skin/legacyGenericContentToSkin.test.ts`
Expected: PASS.

### Task 6: Resolver

**Files:**
- Create: `src/lib/landing/skin/resolveSkin.ts`
- Test: `src/__tests__/lib/landing/skin/resolveSkin.test.ts`

**Interfaces:**
- Consumes: Tasks 3–5.
- Produces:
  - `mergeSkinContent(legacy: SkinContentV1, stored: SkinContentV1): SkinContentV1` (stored wins per field; a stored list replaces the legacy list).
  - `resolveSkin(args: { defaults: ResolvedSkin; stored: SkinContentV1; locale: SkinLocale }): ResolvedSkin`.
  - `isSkinSectionVisible(skin: ResolvedSkin, id: SkinSectionId): boolean`.
  - `pickLocalized(value: SkinLocalized | undefined, locale: SkinLocale): string` (locale, then `es`, `en`, `pt`).

Rules:
- Field: stored text for the locale (with `pickLocalized` fallback), else the default.
- List: if `stored.sections[id].lists[name]` exists, use it (even empty). Else use the default list.
- Item text: `pickLocalized`. Item ids: the stored string, else `""`.
- Visibility: a section with a primary list (`SKIN_PRIMARY_LIST`) is visible only if that list has items. Other sections are visible when any field is non-empty.
- List hole: a stored item with no keys resolves to the default item at the same index; with no default there, it is dropped.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isSkinSectionVisible, mergeSkinContent, resolveSkin } from "@/lib/landing/skin/resolveSkin";
import type { ResolvedSkin } from "@/lib/landing/skin/skinModel";

function defaults(): ResolvedSkin {
  return {
    inicio: { label: "Inicio", scene: "s", title: "Default title", body: "b", cta: "c", heroCta: "h", imageAlt: "a" },
    ritmo: { lines: [{ text: "08:00. Llegada" }] },
    historia: { label: "Historia", body: "hb", manifesto: [] },
    oferta: { label: "Oferta", body: "ob", items: [{ id: "x", name: "Default item", line: "l", detail: "d" }] },
    metodo: { label: "Método", body: "mb", pillars: [] },
    horarios: { label: "Horarios", body: "", levels: [], slots: [] },
    equipo: { label: "Equipo", people: [] },
    comunidad: { label: "Comunidad", body: "cb", title: "ct", closingBody: "" },
    admision: { label: "Admisión", steps: [] },
    faq: { label: "Preguntas", entries: [{ q: "q", a: "a" }] },
    contacto: { label: "Contacto", laterTitle: "lt", laterBody: "lb" },
  };
}

// REGRESSION CHECK: owner value must win over the skin default; a saved empty list must stay empty.
describe("resolveSkin", () => {
  it("uses owner text and falls back to the default", () => {
    const skin = resolveSkin({
      defaults: defaults(),
      stored: { v: 1, sections: { inicio: { fields: { title: { es: "Mi club" } } } } },
      locale: "en",
    });
    expect(skin.inicio.title).toBe("Mi club");
    expect(skin.inicio.body).toBe("b");
  });

  it("replaces a default list with the owner list, even when empty", () => {
    const skin = resolveSkin({
      defaults: defaults(),
      stored: { v: 1, sections: { faq: { lists: { entries: [] } } } },
      locale: "es",
    });
    expect(skin.faq.entries).toEqual([]);
    expect(isSkinSectionVisible(skin, "faq")).toBe(false);
  });

  it("keeps default lists when the owner saved none", () => {
    const skin = resolveSkin({ defaults: defaults(), stored: { v: 1, sections: {} }, locale: "es" });
    expect(skin.oferta.items[0]?.name).toBe("Default item");
    expect(isSkinSectionVisible(skin, "equipo")).toBe(false);
    expect(isSkinSectionVisible(skin, "historia")).toBe(true);
  });

  it("lets stored values win over legacy values", () => {
    const merged = mergeSkinContent(
      { v: 1, sections: { inicio: { fields: { title: { es: "Legacy" }, body: { es: "Legacy body" } } } } },
      { v: 1, sections: { inicio: { fields: { title: { es: "Stored" } } } } },
    );
    expect(merged.sections.inicio?.fields).toEqual({ title: { es: "Stored" }, body: { es: "Legacy body" } });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/landing/skin/resolveSkin.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
import {
  SKIN_FIELDS,
  SKIN_LISTS,
  SKIN_PRIMARY_LIST,
  SKIN_SECTION_IDS,
  type ResolvedSkin,
  type SkinContentV1,
  type SkinLocale,
  type SkinLocalized,
  type SkinSectionId,
  type StoredSkinItem,
} from "@/lib/landing/skin/skinModel";

const FALLBACK: readonly SkinLocale[] = ["es", "en", "pt"];

export function pickLocalized(value: SkinLocalized | undefined, locale: SkinLocale): string {
  if (!value) return "";
  for (const candidate of [locale, ...FALLBACK]) {
    const text = value[candidate]?.trim();
    if (text) return text;
  }
  return "";
}

export function mergeSkinContent(legacy: SkinContentV1, stored: SkinContentV1): SkinContentV1 {
  const sections: SkinContentV1["sections"] = {};
  for (const id of SKIN_SECTION_IDS) {
    const a = legacy.sections[id];
    const b = stored.sections[id];
    if (!a && !b) continue;
    const fields = { ...a?.fields, ...b?.fields };
    const lists = { ...a?.lists, ...b?.lists };
    sections[id] = {
      ...(Object.keys(fields).length ? { fields } : {}),
      ...(Object.keys(lists).length ? { lists } : {}),
    };
  }
  return { v: 1, sections };
}

function resolveItem(item: StoredSkinItem, text: readonly string[], ids: readonly string[], locale: SkinLocale) {
  const out: Record<string, string> = {};
  for (const key of ids) out[key] = typeof item[key] === "string" ? (item[key] as string) : "";
  for (const key of text) out[key] = pickLocalized(item[key] as SkinLocalized | undefined, locale);
  return out;
}

export function resolveSkin(args: { defaults: ResolvedSkin; stored: SkinContentV1; locale: SkinLocale }): ResolvedSkin {
  const result = structuredClone(args.defaults) as unknown as Record<SkinSectionId, Record<string, unknown>>;
  for (const id of SKIN_SECTION_IDS) {
    const section = args.stored.sections[id];
    if (!section) continue;
    for (const field of SKIN_FIELDS[id]) {
      const text = pickLocalized(section.fields?.[field], args.locale);
      if (text) result[id][field] = text;
    }
    for (const [name, spec] of Object.entries(SKIN_LISTS[id] ?? {})) {
      const list = section.lists?.[name];
      if (list) result[id][name] = list.map((item) => resolveItem(item, spec.text, spec.ids, args.locale));
    }
  }
  return result as unknown as ResolvedSkin;
}

export function isSkinSectionVisible(skin: ResolvedSkin, id: SkinSectionId): boolean {
  const section = skin[id] as unknown as Record<string, unknown>;
  const primary = SKIN_PRIMARY_LIST[id];
  if (primary) return Array.isArray(section[primary]) && (section[primary] as unknown[]).length > 0;
  return SKIN_FIELDS[id].some((field) => field !== "label" && typeof section[field] === "string" && section[field] !== "");
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/__tests__/lib/landing/skin/resolveSkin.test.ts`
Expected: PASS.

### Task 7: Palette swap

**Files:**
- Create: `src/lib/landing/skin/skinPalette.ts`
- Test: `src/__tests__/lib/landing/skin/skinPalette.test.ts`

**Interfaces:**
- Consumes: `genericKindColorOverrides`, `GenericInstituteKind` (`@/lib/theme/genericInstituteTemplates`).
- Produces: `swapSkinPalette(args: { from: GenericInstituteKind; to: GenericInstituteKind; properties: Record<string, string> }): Record<string, string>`.

Rule: if every `color.*` key of `genericKindColorOverrides(from)` is absent or equal (case-insensitive) in `properties`, return `properties` with the `to` palette written over those keys. Otherwise return `properties` unchanged. Non-color keys are never touched.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { swapSkinPalette } from "@/lib/landing/skin/skinPalette";
import { genericKindColorOverrides } from "@/lib/theme/genericInstituteTemplates";

// REGRESSION CHECK: owner-chosen colors must survive a skin change.
describe("swapSkinPalette", () => {
  it("moves an untouched palette to the new skin", () => {
    const props = { ...genericKindColorOverrides("deportes"), "brand.name": "Club" };
    const out = swapSkinPalette({ from: "deportes", to: "jardin", properties: props });
    expect(out["color.primary"]).toBe(genericKindColorOverrides("jardin")["color.primary"]);
    expect(out["brand.name"]).toBe("Club");
  });

  it("keeps owner colors", () => {
    const props = { ...genericKindColorOverrides("deportes"), "color.primary": "#123456" };
    expect(swapSkinPalette({ from: "deportes", to: "jardin", properties: props })).toEqual(props);
  });

  it("writes the new palette when no color is set", () => {
    const out = swapSkinPalette({ from: "deportes", to: "musica", properties: {} });
    expect(out).toEqual(genericKindColorOverrides("musica"));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/landing/skin/skinPalette.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import { genericKindColorOverrides, type GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

export function swapSkinPalette(args: {
  from: GenericInstituteKind;
  to: GenericInstituteKind;
  properties: Record<string, string>;
}): Record<string, string> {
  const before = genericKindColorOverrides(args.from);
  const untouched = Object.entries(before).every(([key, value]) => {
    const current = args.properties[key];
    return current === undefined || current.toLowerCase() === value.toLowerCase();
  });
  if (!untouched) return args.properties;
  return { ...args.properties, ...genericKindColorOverrides(args.to) };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/__tests__/lib/landing/skin/skinPalette.test.ts`
Expected: PASS.

### Task 8: Skin defaults in the dictionaries

**Files:**
- Modify: `src/dictionaries/es.json`, `src/dictionaries/en.json`, `src/dictionaries/pt.json` — add `landing.skins.<kind>` for all 10 kinds, shape `ResolvedSkin`.
- Create: `src/lib/landing/skin/skinDefaults.ts`
- Test: `src/__tests__/lib/landing/skin/skinDefaults.test.ts`

**Interfaces:**
- Produces: `skinDefaults(dict: Dictionary, kind: GenericInstituteKind): ResolvedSkin`.

Content rules:
- `*2` kinds: move existing values into the canonical shape. `disciplines`/`stages`/`languages`/`instruments` → `oferta.items`. `pillars` → `metodo.pillars`. `coaches`/`teachers` → `equipo.people`. `slots`/`classes`/`events` → `horarios.slots` (with `levels`). `manifesto`/`seed` → `historia.manifesto`. `steps` → `admision.steps`. `faqs` → `faq.entries`. `communityTitle`/`communityBody`, `trustTitle` → `comunidad`.
- First-family kinds: keep current texts. Write new sample lists for `oferta`, `metodo`, `horarios`, `equipo`, `admision`, `faq` in the voice of each kind. Spanish neutral tuteo. Sample people names are fictional.
- Do not remove `landing.genericLandings.*` yet (Task 15 removes unused keys).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";
import { skinDefaults } from "@/lib/landing/skin/skinDefaults";
import { SKIN_LISTS, SKIN_SECTION_IDS } from "@/lib/landing/skin/skinModel";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";

// REGRESSION CHECK: every skin must ship every section so a skin change never shows an empty page.
describe("skinDefaults", () => {
  for (const [name, dict] of [["es", es], ["en", en], ["pt", pt]] as const) {
    it.each(GENERIC_INSTITUTE_KINDS)(`${name}: %s has every section and lists within limits`, (kind) => {
      const skin = skinDefaults(dict as unknown as Dictionary, kind);
      for (const id of SKIN_SECTION_IDS) expect(skin[id]).toBeDefined();
      expect(skin.inicio.title.length).toBeGreaterThan(0);
      for (const [section, lists] of Object.entries(SKIN_LISTS)) {
        for (const [list, spec] of Object.entries(lists ?? {})) {
          const items = (skin as unknown as Record<string, Record<string, unknown[]>>)[section][list];
          expect(items.length).toBeLessThanOrEqual(spec.max);
        }
      }
      expect(skin.oferta.items.length).toBeGreaterThan(0);
      expect(skin.equipo.people.length).toBeGreaterThan(0);
      expect(skin.faq.entries.length).toBeGreaterThan(0);
    });
  }

  it("keeps slot references valid", () => {
    for (const kind of GENERIC_INSTITUTE_KINDS) {
      const skin = skinDefaults(es as unknown as Dictionary, kind);
      const items = new Set(skin.oferta.items.map((i) => i.id));
      const levels = new Set(skin.horarios.levels.map((l) => l.id));
      for (const slot of skin.horarios.slots) {
        expect(items.has(slot.itemId)).toBe(true);
        expect(levels.has(slot.levelId)).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/landing/skin/skinDefaults.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { ResolvedSkin } from "@/lib/landing/skin/skinModel";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";

export function skinDefaults(dict: Dictionary, kind: GenericInstituteKind): ResolvedSkin {
  return dict.landing.skins[kind] as ResolvedSkin;
}
```

Then add the JSON for all 10 kinds in the three locales. Keep the JSON shape identical across locales (`Dictionary` derives from `en.json`).

- [ ] **Step 4: Run the test and the Spanish lock**

Run: `npx vitest run src/__tests__/lib/landing/skin/skinDefaults.test.ts src/__tests__/i18n/neutralSpanishCopy.test.ts`
Expected: PASS.

### Task 9: Server loader for the resolved skin

**Files:**
- Modify: `src/lib/theme/loadActiveTheme.ts` — select `skin_content` and expose `theme.skinContent: SkinContentV1` (via `parseSkinContent`).
- Create: `src/lib/landing/skin/loadResolvedSkin.ts`
- Test: `src/__tests__/lib/landing/skin/loadResolvedSkin.test.ts`

**Interfaces:**
- Produces: `buildResolvedSkin(args: { dict: Dictionary; kind: GenericInstituteKind; content: SiteThemeContent | null | undefined; skinContent: SkinContentV1; locale: SkinLocale }): ResolvedSkin` (pure: legacy map → merge → resolve).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import { buildResolvedSkin } from "@/lib/landing/skin/loadResolvedSkin";
import type { Dictionary } from "@/types/i18n";

// REGRESSION CHECK: owner text written under another kind must survive a skin change.
describe("buildResolvedSkin", () => {
  it("shows legacy owner text after a switch to another skin", () => {
    const skin = buildResolvedSkin({
      dict: es as unknown as Dictionary,
      kind: "musica",
      content: { inicio: { "genericLandings.deportes.title": { es: "Club Norte" } } },
      skinContent: { v: 1, sections: {} },
      locale: "es",
    });
    expect(skin.inicio.title).toBe("Club Norte");
  });

  it("uses the new skin default where the owner wrote nothing", () => {
    const skin = buildResolvedSkin({
      dict: es as unknown as Dictionary,
      kind: "musica",
      content: null,
      skinContent: { v: 1, sections: {} },
      locale: "es",
    });
    expect(skin.inicio.title).toBe((es as unknown as Dictionary).landing.skins.musica.inicio.title);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/landing/skin/loadResolvedSkin.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import { legacyGenericContentToSkin } from "@/lib/landing/skin/legacyGenericContentToSkin";
import { mergeSkinContent, resolveSkin } from "@/lib/landing/skin/resolveSkin";
import { skinDefaults } from "@/lib/landing/skin/skinDefaults";
import type { ResolvedSkin, SkinContentV1, SkinLocale } from "@/lib/landing/skin/skinModel";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeContent } from "@/types/theming";

export function buildResolvedSkin(args: {
  dict: Dictionary;
  kind: GenericInstituteKind;
  content: SiteThemeContent | null | undefined;
  skinContent: SkinContentV1;
  locale: SkinLocale;
}): ResolvedSkin {
  const stored = mergeSkinContent(legacyGenericContentToSkin(args.content), args.skinContent);
  return resolveSkin({ defaults: skinDefaults(args.dict, args.kind), stored, locale: args.locale });
}
```

In `loadActiveTheme.ts`, add `skin_content` to the select list and map `skinContent: parseSkinContent(row.skin_content)`. Update `src/__tests__/lib/theme/loadActiveTheme*.test.ts` fixtures to include `skin_content`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/lib/landing/skin src/__tests__/lib/theme`
Expected: PASS.

- [ ] **Step 5: Commit Phase 1 (with spec, plan, and ADR)**

```bash
git add docs/superpowers/specs/2026-11-06-centrolisto-template-skins-design.md \
  docs/superpowers/plans/2026-11-06-centrolisto-template-skins.md \
  docs/adr/2026-11-centrolisto-template-skins.md \
  supabase/migrations/266_site_themes_skin_content.sql supabase/migrations/masterdb.sql \
  src/lib/landing/skin src/__tests__/lib/landing/skin src/lib/theme/loadActiveTheme.ts \
  src/__tests__/lib/theme src/dictionaries
git commit -m "feat(skins): canonical content model for CentroListo templates"
```

No changelog entry: nothing is visible yet.

---

## Phase 2 — One renderer, 10 skins (web)

### Task 10: Skin definitions

**Files:**
- Create: `src/lib/landing/skin/skinDefinitions.ts`
- Test: `src/__tests__/lib/landing/skin/skinDefinitions.test.ts`

**Interfaces:**
- Produces: `SkinVariant` unions per section, `SkinDefinition`, `skinDefinition(kind: GenericInstituteKind): SkinDefinition`.

```ts
export type HeroVariant = "bleed" | "split" | "masthead" | "stage" | "title";
export type RitmoVariant = "rows" | "rule" | "steps" | "recital";
export type StoryVariant = "prose" | "manifesto";
export type OfferVariant = "rail" | "grid" | "ruled" | "catalog";
export type MethodVariant = "numbers" | "columns";
export type ScheduleVariant = "table" | "cards" | "agenda";
export type TeamVariant = "list" | "cards";
export type CommunityVariant = "band" | "quote";
export type AdmissionVariant = "steps" | "timeline";
export type FaqVariant = "accordion" | "columns";
export type CloseVariant = "paper" | "quiet" | "narrow" | "stage" | "under";
export type MotionPreset = "calm" | "rise" | "slide" | "none";

export interface SkinDefinition {
  hero: HeroVariant; ritmo: RitmoVariant; historia: StoryVariant; oferta: OfferVariant;
  metodo: MethodVariant; horarios: ScheduleVariant; equipo: TeamVariant; comunidad: CommunityVariant;
  admision: AdmissionVariant; faq: FaqVariant; contacto: CloseVariant; motion: MotionPreset;
}

const DEFINITIONS: Record<GenericInstituteKind, SkinDefinition> = {
  deportes:  { hero: "bleed",    ritmo: "rows",    historia: "prose",     oferta: "grid",    metodo: "numbers", horarios: "table",  equipo: "list",  comunidad: "band",  admision: "steps",    faq: "accordion", contacto: "paper",  motion: "calm" },
  jardin:    { hero: "split",    ritmo: "rule",    historia: "prose",     oferta: "grid",    metodo: "columns", horarios: "cards",  equipo: "cards", comunidad: "quote", admision: "timeline", faq: "accordion", contacto: "quiet",  motion: "calm" },
  colegio:   { hero: "masthead", ritmo: "steps",   historia: "prose",     oferta: "ruled",   metodo: "numbers", horarios: "agenda", equipo: "list",  comunidad: "band",  admision: "steps",    faq: "columns",   contacto: "narrow", motion: "calm" },
  musica:    { hero: "stage",    ritmo: "recital", historia: "prose",     oferta: "catalog", metodo: "columns", horarios: "table",  equipo: "cards", comunidad: "quote", admision: "steps",    faq: "accordion", contacto: "stage",  motion: "calm" },
  idiomas:   { hero: "title",    ritmo: "steps",   historia: "prose",     oferta: "catalog", metodo: "numbers", horarios: "cards",  equipo: "list",  comunidad: "band",  admision: "timeline", faq: "columns",   contacto: "under",  motion: "calm" },
  deportes2: { hero: "stage",    ritmo: "rows",    historia: "manifesto", oferta: "rail",    metodo: "numbers", horarios: "table",  equipo: "list",  comunidad: "band",  admision: "steps",    faq: "accordion", contacto: "stage",  motion: "slide" },
  jardin2:   { hero: "split",    ritmo: "rule",    historia: "manifesto", oferta: "grid",    metodo: "columns", horarios: "cards",  equipo: "cards", comunidad: "quote", admision: "timeline", faq: "accordion", contacto: "quiet",  motion: "rise" },
  colegio2:  { hero: "masthead", ritmo: "steps",   historia: "manifesto", oferta: "ruled",   metodo: "numbers", horarios: "agenda", equipo: "list",  comunidad: "band",  admision: "steps",    faq: "columns",   contacto: "narrow", motion: "rise" },
  idiomas2:  { hero: "title",    ritmo: "steps",   historia: "manifesto", oferta: "catalog", metodo: "numbers", horarios: "cards",  equipo: "list",  comunidad: "band",  admision: "timeline", faq: "columns",   contacto: "under",  motion: "slide" },
  musica2:   { hero: "stage",    ritmo: "recital", historia: "manifesto", oferta: "catalog", metodo: "columns", horarios: "table",  equipo: "cards", comunidad: "quote", admision: "steps",    faq: "accordion", contacto: "stage",  motion: "slide" },
};

export function skinDefinition(kind: GenericInstituteKind): SkinDefinition {
  return DEFINITIONS[kind];
}
```

- [ ] **Step 1: Test** — every kind has a definition; first-family hero/ritmo/contacto values equal the current `genericLandingComposition` values (parity lock).
- [ ] **Step 2: Run, see FAIL.** `npx vitest run src/__tests__/lib/landing/skin/skinDefinitions.test.ts`
- [ ] **Step 3: Implement** with the code above.
- [ ] **Step 4: Run, see PASS.** Then delete `genericLandingComposition.ts` usages in Task 12 (keep `splitGenericRhythm`, move it to `skinDefinitions.ts`).

### Task 11: Section variant components (web)

**Files (create, one component per file, each < 250 lines):**
- `src/components/organisms/skin/SkinHero.tsx` (variants `bleed|split|masthead|stage|title`; reuses markup from `generic-landing/GenericLandingHero.tsx`)
- `src/components/organisms/skin/SkinRitmo.tsx` (from `GenericLandingDay.tsx`)
- `src/components/organisms/skin/SkinStory.tsx`
- `src/components/organisms/skin/SkinOffer.tsx`
- `src/components/organisms/skin/SkinMethod.tsx`
- `src/components/organisms/skin/SkinSchedule.tsx` (client: filters by item and level; from `DeportesDosSchedule.tsx` / `MusicaDosSchedule.tsx`)
- `src/components/organisms/skin/SkinTeam.tsx`
- `src/components/organisms/skin/SkinCommunity.tsx`
- `src/components/organisms/skin/SkinAdmission.tsx`
- `src/components/organisms/skin/SkinFaq.tsx` (native `<details>` accordion)
- `src/components/organisms/skin/SkinClose.tsx` (from `GenericLandingClose.tsx`; keeps `GenericLandingContactForm` → `submitGenericLandingContactAction`)
- `src/components/organisms/skin/skin.module.css` (shared structure + motion presets)
- `src/components/organisms/skin/skins/<kind>.module.css` ×10 (palette-independent type and spacing per skin; move from `*-dos/*.module.css` and `generic-landing/genericLanding.module.css`)

**Interfaces:** each component takes `{ variant; data: ResolvedSkin[<section>]; photo?: string; skinClass: string }`. `SkinSchedule` also takes `items: ResolvedSkin["oferta"]["items"]` and filter labels. Photo source: `mediaMap.get(SKIN_PHOTO_SLOT[id]) ?? genericSectionStockPath(kind, …)`.

Motion: presets in `skin.module.css` only:
```css
.motion-rise { animation: skin-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.motion-slide { animation: skin-slide 480ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes skin-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes skin-slide { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .motion-rise, .motion-slide { animation: none; } }
```

For each component:
- [ ] **Step 1: Write a failing RTL test** in `src/__tests__/components/organisms/skin/<Component>.test.tsx`. Render every variant with a fixture; assert the heading text from `data.label`, each list item's text, and the photo `alt`. For `SkinSchedule`, use `userEvent` to pick an item and assert only its slots remain. For `SkinFaq`, assert each `q` is a `<summary>`. For `SkinClose`, mock `@/app/[locale]/contact/freeSiteContactAction` and assert submit is called.
- [ ] **Step 2: Run, see FAIL.**
- [ ] **Step 3: Implement** the component.
- [ ] **Step 4: Run, see PASS.**

### Task 12: Single renderer for all 10 kinds

**Files:**
- Modify: `src/components/organisms/LandingMainSectionsGeneric.tsx` — props become `{ kind; skin: ResolvedSkin; locale; photos: Partial<Record<SkinSectionId, string>>; contact; contactLabels; siteName; logoSrc; logoAlt; nav }`. Render nav, then each visible section in `SKIN_SECTION_IDS` order with its variant, then footer and `TemplateThumbCta`.
- Modify: `src/lib/landing/loadLandingMainSections.ts` — all 10 generic kinds go through `bindGenericLanding`. Remove the five `*2` dynamic imports. `bindGenericLanding` builds `skin` with `buildResolvedSkin` (needs `content`, `skinContent`, `locale` — extend `LandingMainSectionHostProps` with `themeContent?: SiteThemeContent` and `skinContent?: SkinContentV1`).
- Modify: `src/app/[locale]/page.tsx` — pass `themeContent` and `skinContent` from `loadActiveTheme()`.
- Modify: `src/__tests__/lib/landing/loadLandingMainSections.test.ts` — the five `*2` kinds now expect `LandingMainSectionsGenericBound`.
- Test: `src/__tests__/components/organisms/LandingMainSectionsGeneric.test.tsx`.

- [ ] **Step 1: Update the loader test** (expected names) and write a renderer test: for each kind, render with `skinDefaults(es, kind)`; assert one `h1` and one landmark per visible section id (`#inicio`, `#oferta`, …); assert a section with an empty primary list is absent.
- [ ] **Step 2: Run, see FAIL.** `npx vitest run src/__tests__/lib/landing/loadLandingMainSections.test.ts src/__tests__/components/organisms/LandingMainSectionsGeneric.test.tsx`
- [ ] **Step 3: Implement** the changes above.
- [ ] **Step 4: Run, see PASS.**

### Task 13: Remove the bespoke `*2` organisms, quiz, and audio lab

**Files:**
- Delete: `src/components/organisms/{deportes,jardin,colegio,idiomas,musica}-dos/` (all files), including `IdiomasDosQuiz.tsx` and `MusicaDosLab.tsx`.
- Delete: tests under `src/__tests__/components/organisms/*-dos/` (if present).
- Modify: `src/dictionaries/*.json` — remove `landing.genericLandings.idiomas2.{quizTitle,quizNext,quizNeed,quizRestart,quizResult,questions,bands}` and `landing.genericLandings.musica2.{noise,audioOn,audioStop,audioMute,audioOnAgain,volume,audioFallback}`.

- [ ] **Step 1: Find remaining imports**

Run: `rg -n "(deportes|jardin|colegio|idiomas|musica)-dos/|DosQuiz|DosLab" src`
Expected after deletion: no matches.

- [ ] **Step 2: Delete and run typecheck + tests**

Run: `npx tsc --noEmit && npx vitest run src/__tests__/lib/landing src/__tests__/components/organisms`
Expected: PASS.

### Task 14: Generic-only dictionary cleanup and editor key catalog

**Files:**
- Modify: `src/lib/cms/genericLandingCopyKeys.ts` — keep `isGenericLandingCopyKey` (the legacy mapper and old saves still read these keys). Mark the module as legacy-read-only in its header comment.
- Modify: `src/dictionaries/*.json` — remove `landing.genericLandings.<kind>` keys no longer read by any code.

- [ ] **Step 1: List readers**

Run: `rg -n "genericLandings\." src --glob '!**/__tests__/**'`
Remove only keys with no reader. Keep `genericSectionLabels`, `genericContact`, `genericNav`, `templateNav`.

- [ ] **Step 2: Run** `npx tsc --noEmit && npx vitest run src/__tests__/i18n src/__tests__/lib/cms`
Expected: PASS.

- [ ] **Step 3: Commit Phase 2 with a changelog entry**

Prepend in `src/lib/product-changelog/catalog.ts`:
```ts
{
  id: "centrolisto-skins-same-sections",
  date: "<commit day YYYY-MM-DD>",
  area: "<pick the CentroListo/site area from PRODUCT_CHANGELOG_AREAS>",
  title: t("Plantillas con las mismas secciones", "Templates with the same sections", "Modelos com as mesmas seções"),
  summary: t(
    "Todas las plantillas muestran oferta, horarios, equipo, admisión y preguntas frecuentes; cambia solo el diseño.",
    "Every template shows offer, schedule, team, admission, and FAQ; only the design changes.",
    "Todos os modelos mostram oferta, horários, equipe, admissão e perguntas frequentes; muda só o design.",
  ),
},
```
Then commit:
```bash
git add -A src docs
git commit -m "feat(skins): one renderer for all CentroListo templates"
```

---

## Phase 3 — Skin change with live preview

### Task 15: Server adapter

**Files:**
- Create: `src/lib/pulsar/siteSkinStore.ts`
- Test: `src/__tests__/lib/pulsar/siteSkinStore.test.ts`

**Interfaces:**
- Produces:
  - `loadSiteSkinRow(supabase: SupabaseClient, brandThemeSlug: string): Promise<{ ok: true; row: { id: string; kind: GenericInstituteKind; content: SiteThemeContent; skinContent: SkinContentV1; properties: Record<string, string> } } | { ok: false; code: "theme_missing" | "not_generic" | "db_read_failed" }>`
  - `writeSiteSkinKind(supabase, args: { id: string; kind: GenericInstituteKind; properties: Record<string, string> }): Promise<{ ok: true } | { ok: false; code: "db_write_failed" }>`
  - `writeSiteSkinSection(supabase, args: { id: string; section: SkinSectionId; value: SectionValue; current: SkinContentV1 }): Promise<{ ok: true } | { ok: false; code: "db_write_failed" }>`
  - `writeSiteSkinPalette(supabase, args: { id: string; properties: Record<string, string> }): Promise<…>`
- Reads use `.select("id, template_kind, content, skin_content, properties").eq("slug", brandThemeSlug).is("archived_at", null).maybeSingle()`.
- Every error path calls `logSupabaseError` with scope `siteSkinStore.<fn>` and `{ themeId }`.

- [ ] **Step 1: Failing tests** with a hand-rolled Supabase stub (local to the file): reads map columns; non-generic `template_kind` returns `not_generic`; write calls `update({ template_kind, properties })` with `.eq("id", id)`; error returns `db_write_failed`.
- [ ] **Step 2: Run, see FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, see PASS.**

### Task 16: `changeSiteSkinAction`

**Files:**
- Create: `src/app/[locale]/admin/tenants/[slug]/theme/skinActions.ts`
- Test: `src/__tests__/app/admin/tenants/skinActions.change.test.ts`

**Interfaces:**
- Produces: `changeSiteSkinAction(input: { locale: string; slug: string; kind: string }): Promise<{ ok: true } | { ok: false; code: "unauthorized" | "forbidden" | "invalid_input" | "theme_missing" | "not_generic" | "db_write_failed" }>`.

Flow:
1. `resolvePulsarSiteActor(slug)`. `login` → `unauthorized`. Not `staff` and not `owner` → `logServerAuthzDenied` + `forbidden`.
2. `isGenericInstituteKind(kind)` else `invalid_input`.
3. `loadPulsarTenantBySlugForAdmin(slug)` → `enterTenant` → `createAdminClient()` (same as `loadPulsarThemeEditor`).
4. `loadSiteSkinRow`. If `row.kind === kind`, return `{ ok: true }` with no write.
5. `swapSkinPalette({ from: row.kind, to: kind, properties: row.properties })` → `writeSiteSkinKind`.
6. Insert `platform_audit_log` `{ actor_user_id, actor_email, action: "tenant.skin_change", tenant_slug: slug, changed_fields: ["template_kind"] }` plus `from`/`to` in the existing metadata column if present (check `masterdb` / pulsar migrations; else encode as `changed_fields: ["template_kind", "from:<k>", "to:<k>"]`).
7. Owner actor: `recordUserEventServer` with `event_type: "action"`, `entity: "skin:change"`, metadata `{ to: kind }` (no PII).
8. `revalidatePath("/", "layout")` for the tenant host page cache and `revalidatePath(`/${locale}/admin/tenants/${slug}/theme`)`.

- [ ] **Step 1: Failing tests** (mock `@/lib/pulsar/pulsarSiteActor`, `@/lib/pulsar/pulsarTenantStore`, `@/lib/supabase/admin`, `@/lib/supabase/pulsar`, `next/cache`, `@/lib/analytics/server/recordUserEvent`):
  - another owner (`forbidden`) → no write, `logServerAuthzDenied` called.
  - `login` → `unauthorized`.
  - bad kind → `invalid_input`.
  - owner of the slug → write with swapped palette, audit row, analytics event, revalidate.
  - staff → write, audit, no user event.
  - same kind → no write.
- [ ] **Step 2: Run, see FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, see PASS.**

### Task 17: Preview route

**Files:**
- Create: `src/app/[locale]/admin/tenants/[slug]/theme/skins/[kind]/preview/page.tsx` (RSC shell, `robots: { index: false, follow: false }`).
- Create: `src/lib/pulsar/loadSiteSkinPreview.ts` + test — guards like `loadPulsarThemeEditor`; returns `{ status: "ready"; kind; skin: ResolvedSkin; photos; contact; brand… }` built with the **target** kind and the site's stored content. Writes nothing.
- Create: `src/components/organisms/pulsar/skin/SkinPreviewBar.tsx` (client) — sticky bar: skin name, "Usar esta piel" (`Check` icon) opens `ConfirmActionModal`; "Volver" (`ArrowLeft` icon) links to the picker.
- Create: `src/hooks/useSiteSkin.ts` — `{ change(kind), pending, errorCode }`; calls `changeSiteSkinAction`; on `ok` calls `router.refresh()` and `router.push` to the theme page.
- Tests: `loadSiteSkinPreview.test.ts` (forbidden owner gets `missing`; target kind used; stored text kept), `SkinPreviewBar.test.tsx` (confirm modal lists what changes and what stays; confirm calls the hook), `useSiteSkin.test.ts` (refresh on ok; error code on failure; `vi.hoisted` router mock).

Confirm modal copy keys (add to `en`/`es`/`pt` under `pulsar.account.skins`): `title`, `changes`, `keeps`, `confirm`, `cancel`, `errors.{forbidden,invalid_input,theme_missing,not_generic,db_write_failed,unauthorized}`. Spanish example: `changes`: "Cambian el diseño, las animaciones y las fotos y textos de ejemplo." `keeps`: "Se mantienen tus textos, tus fotos y tus colores."

- [ ] Steps per file: failing test → run (FAIL) → implement → run (PASS).

### Task 18: Skin picker

**Files:**
- Create: `src/components/organisms/pulsar/skin/SkinPicker.tsx` — grid of 10 cards: `genericPreviewSrc(kind)` image (`next/image`, explicit size, lazy), name from `pulsar.account.skins.names.<kind>`, current badge, "Ver con mi contenido" link (`Eye` icon) to the preview route.
- Modify: `src/app/[locale]/admin/tenants/[slug]/theme/page.tsx` — render `SkinPicker` for generic kinds (owner and staff).
- Modify: `src/components/organisms/pulsar/PulsarAdminTemplateSelect.tsx` / `PulsarAdminTenantFieldGroups.tsx` — for free sites (`brandThemeSlug` starts with `generic-`), show the current skin read-only plus a link to the picker. Do not let staff edit `brandThemeSlug` for those rows.
- Modify: `/cuenta` site list — add a "Cambiar piel" link (`Palette` icon) to the theme page for each owned site.
- Tests: `SkinPicker.test.tsx` (10 cards, current marked, links), `PulsarAdminTemplateSelect.test.tsx` update (free site shows link, no select).

- [ ] Steps per file: failing test → FAIL → implement → PASS.
- [ ] **Commit Phase 3** with a changelog entry `centrolisto-skin-switch` ("Cambia la piel de tu sitio cuando quieras" / "Change your site skin at any time" / "Troque a pele do seu site quando quiser").

---

## Phase 4 — Editor: sections, lists, colors, photos

### Task 19: `saveSiteSkinSectionAction` and `saveSiteSkinPaletteAction`

**Files:**
- Modify: `src/app/[locale]/admin/tenants/[slug]/theme/skinActions.ts`
- Test: `src/__tests__/app/admin/tenants/skinActions.save.test.ts`

**Interfaces:**
- `saveSiteSkinSectionAction(input: { locale: string; slug: string; section: string; patch: unknown }): Promise<{ ok: true } | { ok: false; code: "unauthorized" | "forbidden" | "invalid_input" | "list_too_long" | "text_too_long" | "theme_missing" | "db_write_failed" }>`
  - Same actor guard as Task 16.
  - `section` must be in `SKIN_SECTION_IDS`.
  - `parseSkinSectionPatch(section, patch)`.
  - Write `mergeSkinContent(legacyGenericContentToSkin(row.content), row.skinContent)` with the section replaced by the patch (write-through of legacy text).
  - Audit `tenant.skin_content_save` (`changed_fields: [section]`). Owner analytics `entity: "skin:section"`.
  - Revalidate the public page and the editor.
- `saveSiteSkinPaletteAction(input: { locale; slug; primary?: string; accent?: string; paper?: string; reset?: boolean })`
  - `reset: true` → write `genericKindColorOverrides(row.kind)`.
  - Else `parseTemplatePalette` → `templatePaletteOverrides` merged over `row.properties`.
  - Reject a palette whose `color.foreground`/`color.background` pair is below 4.5:1 with `contrast_too_low`. Add a pure `contrastRatio(hexA, hexB)` in `src/lib/theme/contrastRatio.ts` (+ test) if no helper exists (`rg -n "contrastRatio|relativeLuminance" src/lib`).
  - Audit `tenant.skin_palette_save`.

- [ ] Tests: forbidden owner; invalid section; too-long list; legacy text written through on first save; palette reset; low contrast rejected; staff success writes audit.
- [ ] Steps: failing test → FAIL → implement → PASS.

### Task 20: Editor UI

**Files:**
- Create: `src/hooks/useSiteSkinSection.ts` — `{ draft, setField, addItem, updateItem, moveItem, removeItem, save, pending, errorCode }`; `router.refresh()` on `ok`.
- Create: `src/components/organisms/pulsar/skin/SkinSectionEditor.tsx` — fields (es/en/pt tabs, reuse the current site copy inputs), list editors below.
- Create: `src/components/organisms/pulsar/skin/SkinListEditor.tsx` — rows with Edit/Up/Down/Remove (`Pencil`, `ArrowUp`, `ArrowDown`, `Trash2`, icon-only with `aria-label` from dictionary), "Agregar" (`Plus`), disabled at max with a dictionary hint.
- Create: `src/components/organisms/pulsar/skin/SkinSlotItemPicker.tsx` — for `horarios.slots`, selects for `itemId` (from `oferta.items`) and `levelId` (from `horarios.levels`).
- Create: `src/components/organisms/pulsar/skin/SkinPaletteEditor.tsx` — three color inputs, live swatch, "Restaurar colores de la piel" (`RotateCcw`).
- Modify: `src/app/[locale]/admin/tenants/[slug]/theme/landing/[section]/page.tsx` — for generic kinds, render `SkinSectionEditor` for the canonical section; keep the existing media upload block (with `InlineUploadProgressBar`) for sections in `SKIN_PHOTO_SLOT`.
- Modify: `src/app/[locale]/admin/tenants/[slug]/theme/landing/page.tsx` — list the 11 canonical sections for generic kinds.
- Copy keys under `pulsar.account.skins.editor.*` in `en`/`es`/`pt`.
- Tests: hook (add/move/remove; cap at max; refresh), `SkinListEditor` (keyboard reachable buttons, labels), `SkinPaletteEditor` (reset calls action), section page smoke.

- [ ] Steps per file: failing test → FAIL → implement → PASS.
- [ ] **Commit Phase 4** with a changelog entry `centrolisto-skin-editor` ("Edita equipo, horarios y preguntas frecuentes" / "Edit team, schedule, and FAQ" / "Edite equipe, horários e perguntas frequentes").

---

## Phase 5 — Shared mobile tree

### Task 21: Mobile landing

**Files:**
- Create: `src/components/pwa/organisms/skin/SkinLandingMobile.tsx` — same props as `LandingMainSectionsGeneric`. Single column, full-width list rows, ≥44px targets, safe-area padding, bottom sticky contact CTA, schedule filters in a sheet, FAQ as `<details>`. Uses owner colors (tokens) and owner photos. Motion: `motion-rise` only, reduced-motion respected.
- Create: `src/components/pwa/organisms/skin/SkinMobileScheduleSheet.tsx`, `SkinMobileSectionList.tsx` (split to stay < 250 lines).
- Create: `src/components/organisms/skin/SkinLandingEntry.tsx` — thin switch with `SurfaceMountGate` / `useAppSurface()`: `web-desktop` → `LandingMainSectionsGeneric`; `web-mobile` / `pwa-mobile` → `SkinLandingMobile`.
- Modify: `src/lib/landing/loadLandingMainSections.ts` — `bindGenericLanding` renders `SkinLandingEntry`.
- Tests: `SkinLandingMobile.test.tsx` (every visible section, CTA present, sheet opens), `SkinLandingEntry.test.tsx` (mock `useAppSurface` for each surface), update `loadLandingMainSections.test.ts` if the bound name changes.

- [ ] Steps per file: failing test → FAIL → implement → PASS.
- [ ] **Commit Phase 5** with changelog entry `centrolisto-skin-mobile` ("Sitio adaptado al celular" / "Site built for phones" / "Site adaptado ao celular").

---

## Final verification

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm run test:coverage` (≥90% on `src/lib/**`, `src/hooks/**`)
- [ ] `rg -n "(deportes|jardin|colegio|idiomas|musica)-dos/" src` → no matches
- [ ] Each commit passes `npm run precommit`. On failure, ask the user (rule 990).

## Manual QA (user)

- [ ] Each of the 10 skins on desktop and on a phone (browser and installed PWA).
- [ ] On a site with owner text and photos: switch skins twice. Text, photos, and colors stay. Defaults change.
- [ ] As another owner: the theme page and preview of a foreign site are not reachable.
- [ ] Edit each list; check limits and order on the public page.
- [ ] Change colors; reset colors.
- [ ] Lighthouse mobile on one skin of each family (`BASE_URL=… npm run lighthouse:smoke`).

## Self-review notes

- Spec coverage: model (T3–T9), persistence (T2), legacy text (T5, T9, T19), single renderer (T10–T12), removals (T13), picker + preview (T15–T18), authz + audit + analytics (T16, T19), editor + lists + colors + photos (T19–T20), mobile (T21), ADR (T1), changelog (phases 2–5).
- Known follow-up outside this plan: finer staff roles (spec, "later change").
