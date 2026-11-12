import {
  COLOR_TOKEN_KEYS,
  HEADING_WEIGHTS,
  MOTION_LEVELS,
  SPACE_DENSITIES,
  TYPE_SCALES,
} from "@/lib/design-tokens/designTokensV1";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { ThemeDocumentV1, ThemePageId } from "@/lib/theme-document/themeDocumentV1";

export type DraftScope = "home" | ThemePageId;

export type DraftOp =
  | { kind: "setToken"; path: string; value: string }
  | { kind: "setFont"; role: "heading" | "body"; id: string }
  | { kind: "setField"; scope: DraftScope; sectionId: string; field: string; value: unknown }
  | { kind: "moveSection"; scope: DraftScope; sectionId: string; toIndex: number }
  | { kind: "addSection"; scope: DraftScope; section: ThemeSection; atIndex: number }
  | { kind: "removeSection"; scope: DraftScope; sectionId: string }
  | { kind: "setVariant"; scope: DraftScope; sectionId: string; variantId: string; major: number }
  | { kind: "setLock"; path: string; role: "staff" | "admin" };

function colorKey(path: string): (typeof COLOR_TOKEN_KEYS)[number] | null {
  const raw = path.startsWith("tokens.color.")
    ? path.slice("tokens.color.".length)
    : path.startsWith("color.")
      ? path.slice("color.".length)
      : path;
  return COLOR_TOKEN_KEYS.find((key) => key === raw) ?? null;
}

function sectionsOf(doc: ThemeDocumentV1, scope: DraftScope): ThemeSection[] {
  if (scope === "home") return [...doc.sections];
  return [...(doc.pages[scope]?.sections ?? [])];
}

function withSections(doc: ThemeDocumentV1, scope: DraftScope, sections: ThemeSection[]): ThemeDocumentV1 {
  if (scope === "home") return { ...doc, sections };
  return { ...doc, pages: { ...doc.pages, [scope]: { sections } } };
}

function sectionPrefix(scope: DraftScope, sectionId: string): string {
  if (scope === "home") return `sections.${sectionId}`;
  return `pages.${scope}.sections.${sectionId}`;
}

function orderPath(scope: DraftScope): string {
  if (scope === "home") return "sections.order";
  return `pages.${scope}.sections.order`;
}

export function lockPathForOp(op: DraftOp): string {
  switch (op.kind) {
    case "setToken": {
      const key = colorKey(op.path);
      return key ? `tokens.color.${key}` : `tokens.${op.path.replace(/^tokens\./, "")}`;
    }
    case "setFont":
      return `fontIds.${op.role}`;
    case "setField":
      return `${sectionPrefix(op.scope, op.sectionId)}.props.${op.field}`;
    case "moveSection":
    case "addSection":
    case "removeSection":
      return orderPath(op.scope);
    case "setVariant":
      return `${sectionPrefix(op.scope, op.sectionId)}.variant`;
    case "setLock":
      return "editableBy";
  }
}

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

function applyToken(doc: ThemeDocumentV1, path: string, value: string): ThemeDocumentV1 {
  const key = colorKey(path);
  if (key) return { ...doc, tokens: { ...doc.tokens, color: { ...doc.tokens.color, [key]: value } } };
  const name = path.replace(/^tokens\./, "");
  if (name === "type.scale" && isOneOf(TYPE_SCALES, value)) {
    return { ...doc, tokens: { ...doc.tokens, type: { ...doc.tokens.type, scale: value } } };
  }
  if (name === "type.headingWeight") {
    const weight = HEADING_WEIGHTS.find((item) => item === Number(value));
    if (weight === undefined) return { ...doc };
    return { ...doc, tokens: { ...doc.tokens, type: { ...doc.tokens.type, headingWeight: weight } } };
  }
  if (name === "space.density" && isOneOf(SPACE_DENSITIES, value)) {
    return { ...doc, tokens: { ...doc.tokens, space: { ...doc.tokens.space, density: value } } };
  }
  if (name === "motion.level" && isOneOf(MOTION_LEVELS, value)) {
    return { ...doc, tokens: { ...doc.tokens, motion: { ...doc.tokens.motion, level: value } } };
  }
  if (name === "radius.control" || name === "radius.card") {
    const slot = name.endsWith("card") ? "card" : "control";
    return { ...doc, tokens: { ...doc.tokens, radius: { ...doc.tokens.radius, [slot]: value } } };
  }
  return { ...doc };
}

function mapSection(
  sections: ThemeSection[],
  sectionId: string,
  map: (section: ThemeSection) => ThemeSection,
): ThemeSection[] {
  return sections.map((section) => (section.id === sectionId ? map(section) : section));
}

export function applyDraftOp(doc: ThemeDocumentV1, op: DraftOp): ThemeDocumentV1 {
  switch (op.kind) {
    case "setToken":
      return applyToken(doc, op.path, op.value);
    case "setFont":
      return {
        ...doc,
        fontIds: { ...doc.fontIds, [op.role]: op.id },
        tokens: { ...doc.tokens, font: { ...doc.tokens.font, [op.role]: op.id } },
      };
    case "setField":
      return withSections(
        doc,
        op.scope,
        mapSection(sectionsOf(doc, op.scope), op.sectionId, (section) => {
          const props =
            section.props && typeof section.props === "object" && !Array.isArray(section.props)
              ? (section.props as Record<string, unknown>)
              : {};
          return { ...section, props: { ...props, [op.field]: op.value } };
        }),
      );
    case "moveSection": {
      const sections = sectionsOf(doc, op.scope);
      const index = sections.findIndex((section) => section.id === op.sectionId);
      if (index < 0) return { ...doc };
      const [item] = sections.splice(index, 1);
      if (!item) return { ...doc };
      sections.splice(Math.max(0, Math.min(op.toIndex, sections.length)), 0, item);
      return withSections(doc, op.scope, sections);
    }
    case "addSection": {
      const sections = sectionsOf(doc, op.scope);
      sections.splice(Math.max(0, Math.min(op.atIndex, sections.length)), 0, op.section);
      return withSections(doc, op.scope, sections);
    }
    case "removeSection":
      return withSections(
        doc,
        op.scope,
        sectionsOf(doc, op.scope).filter((section) => section.id !== op.sectionId),
      );
    case "setVariant":
      return withSections(
        doc,
        op.scope,
        mapSection(sectionsOf(doc, op.scope), op.sectionId, (section) => ({
          ...section,
          variantId: op.variantId,
          major: op.major,
        })),
      );
    case "setLock":
      return { ...doc, editableBy: { ...doc.editableBy, [op.path]: op.role } };
  }
}
