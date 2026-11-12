import { COLOR_TOKEN_KEYS } from "@/lib/design-tokens/designTokensV1";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { THEME_PAGE_IDS } from "@/lib/theme-document/themeDocumentV1";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";

function locked(prev: ThemeDocumentV1, path: string): boolean {
  return (prev.editableBy[path] ?? "staff") !== "admin";
}

function push(paths: string[], prev: ThemeDocumentV1, path: string): void {
  if (locked(prev, path)) paths.push(path);
}

function record(props: unknown): Record<string, unknown> {
  if (!props || typeof props !== "object" || Array.isArray(props)) return {};
  return props as Record<string, unknown>;
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function diffProps(prev: ThemeDocumentV1, before: unknown, after: unknown, prefix: string, paths: string[]): void {
  const left = record(before);
  const right = record(after);
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (sameValue(left[key], right[key])) continue;
    push(paths, prev, `${prefix}.${key}`);
  }
}

function diffList(
  prev: ThemeDocumentV1,
  before: readonly ThemeSection[],
  after: readonly ThemeSection[],
  orderPath: string,
  prefix: (id: string) => string,
  paths: string[],
): void {
  if (before.map((section) => section.id).join("\0") !== after.map((section) => section.id).join("\0")) {
    push(paths, prev, orderPath);
  }
  const prevById = new Map(before.map((section) => [section.id, section]));
  for (const section of after) {
    const prior = prevById.get(section.id);
    if (!prior) continue;
    if (prior.variantId !== section.variantId || prior.major !== section.major) {
      push(paths, prev, `${prefix(section.id)}.variant`);
    }
    diffProps(prev, prior.props, section.props, `${prefix(section.id)}.props`, paths);
  }
}

export function findLockedFieldEdits(
  prev: ThemeDocumentV1,
  next: ThemeDocumentV1,
  actorRole: "staff" | "admin",
): string[] {
  if (actorRole === "staff") return [];
  const paths: string[] = [];
  const lockKeys = new Set([...Object.keys(prev.editableBy), ...Object.keys(next.editableBy)]);
  for (const key of lockKeys) {
    if (prev.editableBy[key] !== next.editableBy[key]) {
      paths.push("editableBy");
      break;
    }
  }
  diffList(prev, prev.sections, next.sections, "sections.order", (id) => `sections.${id}`, paths);
  for (const pageId of THEME_PAGE_IDS) {
    diffList(
      prev,
      prev.pages[pageId]?.sections ?? [],
      next.pages[pageId]?.sections ?? [],
      `pages.${pageId}.sections.order`,
      (id) => `pages.${pageId}.sections.${id}`,
      paths,
    );
  }
  for (const key of COLOR_TOKEN_KEYS) {
    if (prev.tokens.color[key] === next.tokens.color[key]) continue;
    push(paths, prev, `tokens.color.${key}`);
  }
  if (prev.fontIds.heading !== next.fontIds.heading) push(paths, prev, "fontIds.heading");
  if (prev.fontIds.body !== next.fontIds.body) push(paths, prev, "fontIds.body");
  if (prev.tokens.type.scale !== next.tokens.type.scale) push(paths, prev, "tokens.type.scale");
  if (prev.tokens.type.headingWeight !== next.tokens.type.headingWeight) push(paths, prev, "tokens.type.headingWeight");
  if (prev.tokens.space.density !== next.tokens.space.density) push(paths, prev, "tokens.space.density");
  if (prev.tokens.motion.level !== next.tokens.motion.level) push(paths, prev, "tokens.motion.level");
  if (prev.tokens.radius.control !== next.tokens.radius.control) push(paths, prev, "tokens.radius.control");
  if (prev.tokens.radius.card !== next.tokens.radius.card) push(paths, prev, "tokens.radius.card");
  return paths;
}
