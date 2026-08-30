/**
 * Categorical tones in a high-contrast walk (opposites / far hues),
 * so two neighboring sections are not two blues or two oranges.
 */
const TONES = [
  { h: 212, s: 52, l: 38 },
  { h: 27, s: 88, l: 44 },
  { h: 145, s: 58, l: 30 },
  { h: 350, s: 72, l: 44 },
  { h: 268, s: 50, l: 44 },
  { h: 180, s: 72, l: 30 },
  { h: 46, s: 90, l: 34 },
  { h: 320, s: 58, l: 42 },
  { h: 90, s: 50, l: 30 },
  { h: 235, s: 55, l: 48 },
  { h: 8, s: 78, l: 42 },
  { h: 195, s: 40, l: 28 },
] as const;

export const REGISTER_PICKER_TONE_COUNT = TONES.length;

export function registerPickerSectionIds(sectionIds: readonly string[]): string[] {
  return [...new Set(sectionIds)].sort();
}

export function registerPickerSectionToneIndex(
  sectionId: string,
  allSectionIds: readonly string[],
): number {
  const unique = registerPickerSectionIds(allSectionIds.length > 0 ? allSectionIds : [sectionId]);
  const i = unique.indexOf(sectionId);
  return (i < 0 ? 0 : i) % TONES.length;
}

export function registerPickerSectionTone(
  sectionId: string,
  allSectionIds: readonly string[],
): { index: number; h: number; s: number; l: number } {
  const index = registerPickerSectionToneIndex(sectionId, allSectionIds);
  const tone = TONES[index] ?? TONES[0];
  return { index, h: tone.h, s: tone.s, l: tone.l };
}

export function registerPickerSectionToneStyle(
  sectionId: string,
  intensity: "soft" | "strong",
  allSectionIds: readonly string[],
): { color: string; borderColor: string; backgroundColor: string } {
  const { h, s, l } = registerPickerSectionTone(sectionId, allSectionIds);
  const color = `hsl(${h} ${s}% ${l}%)`;
  const alpha = intensity === "strong" ? 0.32 : 0.16;
  return {
    color,
    borderColor: color,
    backgroundColor: `hsl(${h} ${s}% ${l}% / ${alpha})`,
  };
}
