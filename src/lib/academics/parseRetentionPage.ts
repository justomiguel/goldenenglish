export function parseRetentionPage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = parseInt(String(value ?? "1"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(10_000, parsed);
}
