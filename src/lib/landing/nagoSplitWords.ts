export type NagoTitlePart = { text: string; accent?: boolean };

export type NagoSplitWord = {
  text: string;
  accent: boolean;
  delayIndex: number;
};

export function planNagoSplitWords(
  parts: readonly NagoTitlePart[],
): { ariaLabel: string; words: NagoSplitWord[] } | null {
  const words: Omit<NagoSplitWord, "delayIndex">[] = [];
  for (const part of parts) {
    for (const text of part.text.trim().split(/\s+/).filter(Boolean)) {
      words.push({ text, accent: Boolean(part.accent) });
    }
  }
  if (words.length === 0) return null;
  return {
    ariaLabel: words.map((w) => w.text).join(" "),
    words: words.map((w, i) => ({ ...w, delayIndex: Math.min(i, 5) })),
  };
}
