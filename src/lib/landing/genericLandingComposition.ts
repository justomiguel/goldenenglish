import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

export const GENERIC_LANDING_SECTIONS = [
  "historia",
  "oferta",
  "modalidades",
  "niveles",
  "certificaciones",
] as const;

export type GenericLandingSection = (typeof GENERIC_LANDING_SECTIONS)[number];

export type GenericHeroLayout = "bleed" | "split" | "masthead" | "stage" | "title";
export type GenericDayLayout = "rows" | "rule" | "prospectus" | "recital" | "steps";
export type GenericBandsLayout = "alternate" | "cluster" | "ruled" | "paper" | "breaks";
export type GenericCloseLayout = "paper" | "quiet" | "narrow" | "stage" | "under";

export interface GenericLandingComposition {
  hero: GenericHeroLayout;
  day: GenericDayLayout;
  bands: GenericBandsLayout;
  close: GenericCloseLayout;
}

const COMPOSITIONS: Record<GenericInstituteKind, GenericLandingComposition> = {
  deportes: { hero: "bleed", day: "rows", bands: "alternate", close: "paper" },
  jardin: { hero: "split", day: "rule", bands: "cluster", close: "quiet" },
  colegio: { hero: "masthead", day: "prospectus", bands: "ruled", close: "narrow" },
  musica: { hero: "stage", day: "recital", bands: "paper", close: "stage" },
  idiomas: { hero: "title", day: "steps", bands: "breaks", close: "under" },
};

export function genericLandingComposition(kind: GenericInstituteKind): GenericLandingComposition {
  return COMPOSITIONS[kind];
}

export function splitGenericRhythm(line: string): { mark: string; rest: string } {
  const match = /^(\d{1,2}:\d{2})\.\s+([\s\S]+)$/.exec(line.trim());
  if (!match) return { mark: "", rest: line };
  return { mark: match[1] ?? "", rest: match[2] ?? line };
}
