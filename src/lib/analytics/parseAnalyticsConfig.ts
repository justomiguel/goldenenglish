export interface AnalyticsConfigValues {
  namespace: string;
  version: string;
  timezone: string;
}

const DEFAULTS: AnalyticsConfigValues = {
  namespace: "goldenenglish",
  version: "1",
  timezone: "America/Argentina/Cordoba",
};

function pickString(raw: unknown, fallback: string): string {
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  return fallback;
}

export function parseAnalyticsConfig(
  raw: unknown,
  defaults: AnalyticsConfigValues = DEFAULTS,
): AnalyticsConfigValues {
  if (!raw || typeof raw !== "object") return defaults;
  const r = raw as Record<string, unknown>;
  return {
    namespace: pickString(r.namespace, defaults.namespace),
    version: pickString(r.version, defaults.version),
    timezone: pickString(r.timezone, defaults.timezone),
  };
}

export const ANALYTICS_CONFIG_DEFAULTS = DEFAULTS;
