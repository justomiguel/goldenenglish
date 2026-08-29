export const PUBLIC_CTA_MODES = ["reserve", "trial", "both"] as const;

export type PublicCtaMode = (typeof PUBLIC_CTA_MODES)[number];

export function parsePublicCtaMode(raw: unknown): PublicCtaMode {
  if (raw === "reserve" || raw === "trial" || raw === "both") return raw;
  return "reserve";
}
