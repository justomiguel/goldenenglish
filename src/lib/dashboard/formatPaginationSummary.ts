/** Replaces {{from}}, {{to}}, {{total}} in pagination summary templates. */
export function formatPaginationSummary(
  template: string,
  from: number,
  to: number,
  total: number,
): string {
  return template
    .replace(/\{\{from\}\}/g, String(from))
    .replace(/\{\{to\}\}/g, String(to))
    .replace(/\{\{total\}\}/g, String(total));
}
