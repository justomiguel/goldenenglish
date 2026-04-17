import { getProperty, loadProperties } from "@/lib/theme/themeParser";

const KEY = "analytics.timezone";
const DEFAULT_TZ = "America/Argentina/Cordoba";

export function getInstituteTimeZone(): string {
  const raw = (getProperty(loadProperties(), KEY, DEFAULT_TZ) || DEFAULT_TZ).trim();
  return raw || DEFAULT_TZ;
}
