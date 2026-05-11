/**
 * Flow receipts / subject limits are tight; trim long section titles.
 */
export function truncateForFlowText(s: string, maxChars: number): string {
  if (maxChars <= 0) return "";
  const t = s.trim();
  if (t.length <= maxChars) return t;
  if (maxChars <= 1) return "…";
  return `${t.slice(0, maxChars - 1).trim()}…`;
}
