import { getProperty, loadProperties } from "@/lib/theme/themeParser";

/** Legal age of majority from `SYSTEM_PROPERTIES_DEFAULTS` (`legal.age.majority`). Deprecated: prefer `loadLegalAgeMajority` for DB-backed value. */
export function getLegalAgeMajorityFromSystem(): number {
  const props = loadProperties();
  const raw = getProperty(props, "legal.age.majority", "18");
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 120) return 18;
  return n;
}
