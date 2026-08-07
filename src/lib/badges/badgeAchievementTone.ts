/**
 * Maps locked badge progress to a visual tone: gray/faint at 0% → full color at 100%.
 * Earned badges always render at full color.
 */
export function badgeAchievementToneStyle(
  locked: boolean,
  percent: number | null | undefined,
): { filter: string; opacity: number } {
  if (!locked) {
    return { filter: "none", opacity: 1 };
  }
  const p = Math.min(100, Math.max(0, percent ?? 0)) / 100;
  return {
    filter: `grayscale(${(1 - p).toFixed(3)})`,
    opacity: Number((0.35 + 0.65 * p).toFixed(3)),
  };
}
