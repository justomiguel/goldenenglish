/**
 * Parse site_settings.merch_enabled JSON value.
 * Missing or unknown values default to false (unlike blog_enabled).
 */
export function parseMerchEnabled(value: unknown): boolean {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return false;
}
