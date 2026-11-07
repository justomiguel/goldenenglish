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

const ITEM_ID = /^[a-z0-9-]{1,40}$/;

function maxFor(field: string): number {
  return SKIN_LONG_FIELDS.has(field) ? MAX_SKIN_LONG_TEXT : MAX_SKIN_TEXT;
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
    if (typeof value === "string" && ITEM_ID.test(value)) item[key] = value;
  }
  for (const key of text) {
    const value = looseLocalized(obj[key], maxFor(key));
    if (value) item[key] = value;
  }
  return Object.keys(item).length ? item : null;
}

/** Tolerant reader. Never throws. Drops anything outside the canonical model. */
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
        ...Object.fromEntries(spec.ids.map((k) => [k, z.string().regex(ITEM_ID)])),
        ...Object.fromEntries(spec.text.map((k) => [k, strictLocalized(maxFor(k)).optional()])),
      };
      return [name, z.array(z.object(itemShape).strict()).max(spec.max, "list_too_long").optional()];
    }),
  );
  return z
    .object({ fields: z.object(fieldShape).strict().optional(), lists: z.object(listShape).strict().optional() })
    .strict();
}

/** Strict validator for owner edits of one section. */
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
