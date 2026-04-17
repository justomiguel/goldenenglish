import { alpha2ToAlpha3, getAlpha2Code, registerLocale } from "i18n-iso-countries";
import type { LocaleData } from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import es from "i18n-iso-countries/langs/es.json";

let countryNamesRegistered = false;

function ensureCountryNamesRegistered() {
  if (countryNamesRegistered) return;
  registerLocale(en as LocaleData);
  registerLocale(es as LocaleData);
  countryNamesRegistered = true;
}

/**
 * Manual aliases for GeoJSON country names that don't exactly match
 * `i18n-iso-countries` canonical labels (D3 Graph Gallery / Natural Earth common diffs).
 */
const NAME_ALIASES_TO_ALPHA2: Record<string, string> = {
  "united states of america": "US",
  "united states": "US",
  "russian federation": "RU",
  "russia": "RU",
  "republic of korea": "KR",
  "south korea": "KR",
  "korea, republic of": "KR",
  "democratic people's republic of korea": "KP",
  "north korea": "KP",
  "iran (islamic republic of)": "IR",
  "iran": "IR",
  "syrian arab republic": "SY",
  "syria": "SY",
  "viet nam": "VN",
  "vietnam": "VN",
  "lao people's democratic republic": "LA",
  "laos": "LA",
  "tanzania": "TZ",
  "united republic of tanzania": "TZ",
  "venezuela": "VE",
  "bolivia": "BO",
  "moldova": "MD",
  "republic of moldova": "MD",
  "macedonia": "MK",
  "the former yugoslav republic of macedonia": "MK",
  "north macedonia": "MK",
  "czech republic": "CZ",
  "czechia": "CZ",
  "ivory coast": "CI",
  "côte d'ivoire": "CI",
  "cote d'ivoire": "CI",
  "democratic republic of the congo": "CD",
  "dem. rep. congo": "CD",
  "republic of the congo": "CG",
  "congo": "CG",
  "brunei": "BN",
  "brunei darussalam": "BN",
  "swaziland": "SZ",
  "eswatini": "SZ",
  "myanmar": "MM",
  "burma": "MM",
  "palestine": "PS",
  "state of palestine": "PS",
  "taiwan": "TW",
  "republic of china": "TW",
  "vatican": "VA",
  "holy see": "VA",
  "falkland islands": "FK",
  "falkland is.": "FK",
  "western sahara": "EH",
  "w. sahara": "EH",
  "kosovo": "XK",
};

function nameToIso3(name: string, locale: "en" | "es"): string {
  ensureCountryNamesRegistered();
  const cleaned = name.trim();
  if (!cleaned) return "";
  const lower = cleaned.toLowerCase();
  const aliasA2 = NAME_ALIASES_TO_ALPHA2[lower];
  if (aliasA2) return alpha2ToAlpha3(aliasA2) ?? "";
  const a2 = getAlpha2Code(cleaned, locale) ?? getAlpha2Code(cleaned, "en");
  if (!a2) return "";
  return alpha2ToAlpha3(a2) ?? "";
}

/**
 * ISO 3166-1 alpha-3 from a react-simple-maps geography.
 * Handles geojson sources that only ship `properties.name` (D3 Graph Gallery / Natural Earth Light)
 * by mapping the country label through `i18n-iso-countries` and curated aliases.
 */
export function iso3FromChoroplethGeography(
  g: {
    id?: string;
    properties?: Record<string, unknown>;
  },
  locale: "en" | "es" = "en",
): string {
  const rawId = g.id;
  if (typeof rawId === "string") {
    const t = rawId.trim().toUpperCase();
    if (t.length === 3 && /^[A-Z]{3}$/.test(t)) return t;
  }
  const p = g.properties;
  if (p) {
    for (const key of ["ISO_A3", "ISO_A3_EH", "ADM0_A3", "GU_A3", "WB_A3"] as const) {
      const v = p[key];
      if (typeof v !== "string") continue;
      const t = v.trim().toUpperCase();
      if (t.length >= 3 && /^[A-Z0-9]{3}/.test(t) && !t.startsWith("-99")) return t.slice(0, 3);
    }
    const name = typeof p.name === "string" ? p.name : null;
    if (name) {
      const fromName = nameToIso3(name, locale);
      if (fromName) return fromName;
    }
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

export type ChoroplethGeographyFill = { fill: string; fillOpacity?: number };

/**
 * Choropleth fill for SVG paths. Avoids `color-mix` + CSS vars in SVG `fill`, which many
 * engines treat as invalid (everything looks unshaded). Uses `fillOpacity` on `--color-primary`.
 * `t` in [0,1]: relative to max traffic in the period.
 */
export function choroplethGeographyFill(t: number, hasData: boolean): ChoroplethGeographyFill {
  if (!hasData) return { fill: "var(--color-muted, #d9d7cf)" };
  const x = Math.min(1, Math.max(0, t));
  const minOpacity = 0.45;
  return {
    fill: "var(--color-primary, #103A5C)",
    fillOpacity: minOpacity + (1 - minOpacity) * x,
  };
}
