import { contrastRatio, relativeLuminance } from "@/lib/theme/contrastRatio";
import {
  genericKindDefaultPalette,
  type GenericInstituteKind,
  type GenericTemplatePalette,
} from "@/lib/theme/genericInstituteTemplates";

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** Saved theme colors, or the template defaults when a channel is missing. */
export function paletteFromThemeProperties(
  kind: GenericInstituteKind,
  properties: Readonly<Record<string, string>> | null | undefined,
): GenericTemplatePalette {
  const fallback = genericKindDefaultPalette(kind);
  return (
    parseTemplatePalette({
      primary: properties?.["color.primary"] || fallback.primary,
      accent: properties?.["color.accent"] || properties?.["color.secondary"] || fallback.accent,
      paper: properties?.["color.background"] || fallback.paper,
    }) ?? fallback
  );
}

export function parseTemplatePalette(input: {
  primary?: string | null;
  accent?: string | null;
  paper?: string | null;
}): GenericTemplatePalette | null {
  const primary = normalizeHex(input.primary);
  const accent = normalizeHex(input.accent);
  const paper = normalizeHex(input.paper);
  if (!primary || !accent || !paper) return null;
  return { primary, accent, paper };
}

export function templatePreviewHref(
  locale: string,
  kind: string,
  palette: GenericTemplatePalette,
): string {
  const query = new URLSearchParams({
    primary: palette.primary,
    accent: palette.accent,
    paper: palette.paper,
  });
  return `/${locale}/plantilla/${kind}?${query.toString()}`;
}

/** Full color map for one chosen palette. Text stays readable on the paper. */
export function templatePaletteOverrides(palette: GenericTemplatePalette): Record<string, string> {
  const ink = readableOn(palette.paper, palette.primary);
  const onPrimary = readableOn(palette.primary, palette.paper);
  const muted = mixHex(palette.paper, ink, 0.14);
  return {
    "color.primary": palette.primary,
    "color.primary.dark": darkenHex(palette.primary, 0.28),
    "color.primary.foreground": onPrimary,
    "color.primary.light": lightenHex(palette.primary, 0.35),
    "color.secondary": palette.accent,
    "color.secondary.light": lightenHex(palette.accent, 0.25),
    "color.secondary.dark": darkenHex(palette.accent, 0.28),
    "color.secondary.foreground": readableOn(palette.accent, palette.paper),
    "color.accent": palette.accent,
    "color.accent.foreground": readableOn(palette.accent, ink),
    "color.background": palette.paper,
    "color.surface": lightenHex(palette.paper, 0.45),
    "color.foreground": ink,
    "color.muted": muted,
    "color.muted.foreground": ink,
    "color.border": muted,
  };
}

function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (!HEX.test(withHash)) return null;
  return withHash.toUpperCase();
}

function channels(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function toHex(parts: [number, number, number]): string {
  return `#${parts.map((part) => part.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function darkenHex(hex: string, amount: number): string {
  return toHex(channels(hex).map((part) => Math.round(part * (1 - amount))) as [number, number, number]);
}

function lightenHex(hex: string, amount: number): string {
  return toHex(
    channels(hex).map((part) => Math.round(part + (255 - part) * amount)) as [number, number, number],
  );
}

function mixHex(from: string, to: string, amount: number): string {
  const a = channels(from);
  const b = channels(to);
  return toHex(a.map((part, index) => Math.round(part + (b[index] - part) * amount)) as [number, number, number]);
}

function readableOn(background: string, preferred: string): string {
  let ink = preferred;
  for (let step = 0; step < 6; step += 1) {
    if (contrastRatio(ink, background) >= 4.5) return ink;
    ink = relativeLuminance(background) > 0.4 ? darkenHex(ink, 0.18) : lightenHex(ink, 0.18);
  }
  return relativeLuminance(background) > 0.4 ? "#1C1917" : "#FFFFFF";
}
