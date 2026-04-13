import { alpha2ToAlpha3 } from "i18n-iso-countries";

/** ISO 3166-1 alpha-3 from a react-simple-maps geography (GeoJSON feature + svgPath). */
export function iso3FromChoroplethGeography(g: {
  id?: string;
  properties?: Record<string, unknown>;
}): string {
  const rawId = g.id;
  if (typeof rawId === "string") {
    const t = rawId.trim().toUpperCase();
    if (t.length === 3 && /^[A-Z]{3}$/.test(t)) return t;
  }
  const p = g.properties;
  if (!p) return "";
  for (const key of ["ISO_A3", "ISO_A3_EH", "ADM0_A3", "GU_A3", "WB_A3"] as const) {
    const v = p[key];
    if (typeof v !== "string") continue;
    const t = v.trim().toUpperCase();
    if (t.length >= 3 && /^[A-Z0-9]{3}/.test(t) && !t.startsWith("-99")) return t.slice(0, 3);
  }
  return "";
}

/** Sum hits by ISO 3166-1 alpha-3 (GeoJSON map key). */
export function trafficGeoRowsToIso3Counts(rows: { country: string; cnt: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const c2 = r.country.trim().toUpperCase();
    if (!c2 || c2 === "UNKNOWN") continue;
    const c3 = alpha2ToAlpha3(c2);
    if (!c3) continue;
    const k = c3.toUpperCase();
    m.set(k, (m.get(k) ?? 0) + Number(r.cnt));
  }
  return m;
}

/** `t` in [0,1]: 0 = low relative traffic, 1 = max for the period. */
export function fillForIntensity(t: number, hasData: boolean): string {
  if (!hasData) return "var(--color-muted)";
  const x = Math.min(1, Math.max(0, t));
  return `color-mix(in srgb, var(--color-primary) ${Math.round(x * 100)}%, var(--color-muted) ${Math.round((1 - x) * 100)}%)`;
}
