/**
 * Pure geometry for the Liora landing ribbon. The ribbon weaves down the page
 * on the side opposite to each section's text. The dancer rides its tip.
 */

export type LioraPoseName =
  | "arabesque"
  | "pirouette"
  | "grandJete"
  | "attitude"
  | "saute"
  | "reverence";

export type LioraRibbonSide = "start" | "end" | "center";

/** Where a section puts its text. `full` means the section has no free side. */
export type LioraTextSide = "start" | "end" | "center" | "full";

export interface LioraRibbonAnchor {
  y: number;
  side: LioraRibbonSide;
  pose: LioraPoseName;
}

export interface LioraRibbonSample {
  /** Fraction of the path length, 0..1. */
  f: number;
  /** Vertical position of the path at that fraction. */
  y: number;
}

export const LIORA_RIBBON_POSES: Readonly<Record<string, LioraPoseName>> = {
  hero: "arabesque",
  sobre: "pirouette",
  clases: "pirouette",
  sedes: "grandJete",
  horarios: "attitude",
  galeria: "saute",
  cta: "reverence",
};

export function lioraPoseFor(section: string): LioraPoseName {
  return LIORA_RIBBON_POSES[section] ?? "arabesque";
}

export function ribbonX(side: LioraRibbonSide, width: number, margin: number): number {
  if (side === "start") return margin;
  if (side === "end") return width - margin;
  return width / 2;
}

export function ribbonSideForText(
  textSide: LioraTextSide,
  previous: LioraRibbonSide,
): LioraRibbonSide {
  if (textSide === "start") return "end";
  if (textSide === "end") return "start";
  if (textSide === "center") return "center";
  return previous === "end" ? "start" : "end";
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export function buildLioraRibbonPath(
  anchors: readonly LioraRibbonAnchor[],
  width: number,
  margin: number,
): string {
  if (anchors.length < 2) return "";
  const points = anchors.map((a) => ({ x: round(ribbonX(a.side, width, margin)), y: round(a.y) }));
  const [first, ...rest] = points;
  let d = `M${first!.x} ${first!.y}`;
  let prev = first!;
  for (const p of rest) {
    const midY = round(prev.y + (p.y - prev.y) / 2);
    d += ` C${prev.x} ${midY} ${p.x} ${midY} ${p.x} ${p.y}`;
    prev = p;
  }
  return d;
}

export function fractionForY(samples: readonly LioraRibbonSample[], y: number): number {
  if (samples.length === 0) return 0;
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  if (y <= first.y) return first.f;
  if (y >= last.y) return last.f;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!;
    const b = samples[i]!;
    if (y <= b.y) {
      const span = b.y - a.y;
      return span <= 0 ? b.f : a.f + ((y - a.y) / span) * (b.f - a.f);
    }
  }
  return last.f;
}

export function activeAnchorIndex(anchors: readonly LioraRibbonAnchor[], y: number): number {
  let index = 0;
  anchors.forEach((anchor, i) => {
    if (y >= anchor.y) index = i;
  });
  return index;
}
