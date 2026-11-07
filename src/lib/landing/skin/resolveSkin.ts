import {
  SKIN_FIELDS,
  SKIN_LISTS,
  SKIN_PRIMARY_LIST,
  SKIN_SECTION_IDS,
  type ResolvedSkin,
  type SkinContentV1,
  type SkinListSpec,
  type SkinLocale,
  type SkinLocalized,
  type SkinSectionId,
  type StoredSkinItem,
} from "@/lib/landing/skin/skinModel";

const FALLBACK: readonly SkinLocale[] = ["es", "en", "pt"];

/** Picks the locale text, then es, en, pt. Returns "" when none has text. */
export function pickLocalized(value: SkinLocalized | undefined, locale: SkinLocale): string {
  if (!value) return "";
  for (const candidate of [locale, ...FALLBACK]) {
    const text = value[candidate]?.trim();
    if (text) return text;
  }
  return "";
}

/** Stored wins per field. A stored list replaces the legacy list. */
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
  for (const key of ids) {
    const value = item[key];
    out[key] = typeof value === "string" ? value : "";
  }
  for (const key of text) {
    const value = item[key];
    out[key] = typeof value === "object" ? pickLocalized(value, locale) : "";
  }
  return out;
}

/** A stored item with no keys is a hole: it takes the default item at its index, or is dropped. */
function resolveList(list: StoredSkinItem[], defaultList: unknown[], spec: SkinListSpec, locale: SkinLocale): unknown[] {
  const out: unknown[] = [];
  list.forEach((item, index) => {
    if (Object.keys(item).length > 0) {
      out.push(resolveItem(item, spec.text, spec.ids, locale));
    } else if (index < defaultList.length) {
      out.push(defaultList[index]);
    }
  });
  return out;
}

type SkinBag = Record<SkinSectionId, Record<string, unknown>>;

export function resolveSkin(args: { defaults: ResolvedSkin; stored: SkinContentV1; locale: SkinLocale }): ResolvedSkin {
  const result: SkinBag = structuredClone(args.defaults);
  for (const id of SKIN_SECTION_IDS) {
    const section = args.stored.sections[id];
    if (!section) continue;
    for (const field of SKIN_FIELDS[id]) {
      const text = pickLocalized(section.fields?.[field], args.locale);
      if (text) result[id][field] = text;
    }
    for (const [name, spec] of Object.entries(SKIN_LISTS[id] ?? {})) {
      const list = section.lists?.[name];
      if (!list) continue;
      const defaultList = Array.isArray(result[id][name]) ? (result[id][name] as unknown[]) : [];
      result[id][name] = resolveList(list, defaultList, spec, args.locale);
    }
  }
  // The bag keeps the same keys as `defaults`; only values named in SKIN_FIELDS / SKIN_LISTS were replaced
  // with values of the matching type, so the shape of ResolvedSkin holds.
  return result as unknown as ResolvedSkin;
}

export function isSkinSectionVisible(skin: ResolvedSkin, id: SkinSectionId): boolean {
  const section: Record<string, unknown> = skin[id];
  const primary = SKIN_PRIMARY_LIST[id];
  if (primary) {
    const list = section[primary];
    return Array.isArray(list) && list.length > 0;
  }
  return SKIN_FIELDS[id].some((field) => field !== "label" && typeof section[field] === "string" && section[field] !== "");
}
