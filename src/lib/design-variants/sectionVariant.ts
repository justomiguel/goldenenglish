import type { ZodType } from "zod";

export const SECTION_SLOTS = [
  "hero",
  "band",
  "schedule",
  "team",
  "faq",
  "contact",
  "close",
  "nav",
  "footer",
  "page",
] as const;

export type SectionSlot = (typeof SECTION_SLOTS)[number];

export type DesignTokenKey =
  | `color.${string}`
  | `font.${string}`
  | `type.${string}`
  | `radius.${string}`
  | `space.${string}`
  | `motion.${string}`;

export type VariantEditorField =
  | { key: string; kind: "text" | "longText"; labelKey: string; maxLength?: number }
  | { key: string; kind: "image" | "toggle"; labelKey: string }
  | { key: string; kind: "select"; labelKey: string; options: readonly string[] }
  | { key: string; kind: "list"; labelKey: string; itemFields: readonly VariantEditorField[] };

export interface ThemeSection {
  id: string;
  variantId: string;
  major: number;
  props: unknown;
}

export interface VariantViewModule<P> {
  default(props: P): unknown;
}

export interface SectionVariant<P> {
  id: string;
  slot: SectionSlot;
  major: number;
  patch: number;
  owner?: string;
  propsSchema: ZodType<P>;
  editorFields: readonly VariantEditorField[];
  consumesTokens: readonly DesignTokenKey[];
  interactive: boolean;
  web: () => Promise<VariantViewModule<P>>;
  pwa?: () => Promise<VariantViewModule<P>>;
  migrateProps?: (fromMajor: number, props: unknown) => unknown;
}

export type VariantIssueCode = "variant_version_missing" | "variant_not_available" | "variant_props_invalid";

export type ResolveSectionResult<P = unknown> =
  | { ok: true; variant: SectionVariant<P>; props: P }
  | { ok: false; code: VariantIssueCode };
