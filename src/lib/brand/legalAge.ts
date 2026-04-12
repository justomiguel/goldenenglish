import { getProperty, loadProperties } from "@/lib/theme/themeParser";

/** Edad de mayoría desde `system.properties` (`legal.age.majority`). */
export function getLegalAgeMajorityFromSystem(): number {
  const props = loadProperties();
  const raw = getProperty(props, "legal.age.majority", "18");
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 120) return 18;
  return n;
}
