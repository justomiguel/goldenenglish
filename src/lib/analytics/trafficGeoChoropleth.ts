import { alpha2ToAlpha3 } from "i18n-iso-countries";

/** Suma hits por ISO 3166-1 alpha-3 (clave del GeoJSON del mapa). */
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

/** `t` en [0,1]: 0 = poco tráfico relativo, 1 = máximo del periodo. */
export function fillForIntensity(t: number, hasData: boolean): string {
  if (!hasData) return "var(--color-muted)";
  const x = Math.min(1, Math.max(0, t));
  return `color-mix(in srgb, var(--color-primary) ${Math.round(x * 100)}%, var(--color-muted) ${Math.round((1 - x) * 100)}%)`;
}
