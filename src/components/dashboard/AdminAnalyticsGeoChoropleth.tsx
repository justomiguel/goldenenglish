"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { choroplethCountryLabel } from "@/lib/analytics/choroplethCountryLabel";
import {
  choroplethGeographyFill,
  iso3FromChoroplethGeography,
  trafficGeoRowsToIso3Counts,
} from "@/lib/analytics/trafficGeoChoropleth";
import type { Dictionary } from "@/types/i18n";

const GEO_URLS = [
  "https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/DATA/world.geojson",
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
];

type GeoJson = {
  type: string;
  features: Array<{ type: string; properties?: { name?: string }; id?: string }>;
};

/** react-simple-maps render-prop payload (package ships without types). */
type RsmGeography = {
  id?: string;
  rsmKey: string;
  properties?: Record<string, unknown>;
};

export type TrafficGeoRow = { country: string; cnt: number };

type MapTip = { x: number; y: number; title: string; line: string };

interface AdminAnalyticsGeoChoroplethProps {
  locale: string;
  labels: Pick<
    Dictionary["admin"]["analytics"],
    | "chartWorldMapLegend"
    | "worldMapLoading"
    | "worldMapError"
    | "worldMapNoCountryData"
    | "trafficTopCountries"
    | "worldMapTooltipVisits"
    | "worldMapTooltipNoVisits"
    | "worldMapUnknownRegion"
  >;
  rows: TrafficGeoRow[];
}

async function fetchGeoJsonFirstOk(): Promise<GeoJson> {
  let lastErr: unknown;
  for (const url of GEO_URLS) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      return (await r.json()) as GeoJson;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("geo");
}

export function AdminAnalyticsGeoChoropleth({ locale, labels, rows }: AdminAnalyticsGeoChoroplethProps) {
  const [geo, setGeo] = useState<GeoJson | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [tip, setTip] = useState<MapTip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const iso3Counts = useMemo(() => trafficGeoRowsToIso3Counts(rows), [rows]);
  const hasCountryHits = iso3Counts.size > 0;
  const max = useMemo(() => Math.max(1, ...iso3Counts.values()), [iso3Counts]);
  const top = useMemo(
    () =>
      [...rows]
        .map((r) => ({ country: r.country, cnt: Number(r.cnt) }))
        .sort((a, b) => b.cnt - a.cnt)
        .slice(0, 8),
    [rows],
  );
  const nf = useMemo(
    () => new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", { maximumFractionDigits: 0 }),
    [locale],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchGeoJsonFirstOk()
      .then((j) => {
        if (!cancelled) setGeo(j);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tipCoords = (e: ReactMouseEvent<Element>) => {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  if (loadError) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
        {labels.worldMapError}
      </p>
    );
  }

  if (!geo) {
    return (
      <div
        className="h-[min(440px,70vw)] min-h-[280px] w-full animate-pulse rounded-md bg-[var(--color-muted)]"
        aria-busy="true"
        aria-label={labels.worldMapLoading}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div ref={wrapRef} className="relative w-full min-w-0 overflow-x-auto">
        {tip ? (
          <div
            className="pointer-events-none absolute z-20 max-w-[min(280px,calc(100%-1rem))] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left text-xs shadow-md"
            style={{ left: tip.x + 14, top: tip.y + 14 }}
            role="status"
            aria-live="polite"
          >
            <p className="font-semibold text-[var(--color-primary)]">{tip.title}</p>
            <p className="mt-0.5 text-[var(--color-muted-foreground)]">{tip.line}</p>
          </div>
        ) : null}
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 168, center: [0, 12] }}
          width={880}
          height={440}
          className="mx-auto max-w-full [&_svg]:h-auto [&_svg]:max-w-full"
        >
          <Geographies geography={geo}>
            {({ geographies }: { geographies: RsmGeography[] }) =>
              geographies.map((g) => {
                const id = iso3FromChoroplethGeography(g, locale === "es" ? "es" : "en");
                const cnt = iso3Counts.get(id) ?? 0;
                const t = cnt / max;
                const { fill, fillOpacity } = choroplethGeographyFill(t, cnt > 0);
                return (
                  <Geography
                    key={g.rsmKey}
                    geography={g}
                    stroke="var(--color-border)"
                    strokeWidth={0.35}
                    style={{
                      default: { fill, fillOpacity, stroke: "var(--color-border)", outline: "none", cursor: "pointer" },
                      hover: { fill, fillOpacity, stroke: "var(--color-border)", outline: "none", opacity: 0.88 },
                      pressed: { fill, fillOpacity, stroke: "var(--color-border)", outline: "none" },
                    }}
                    onMouseEnter={(e: ReactMouseEvent<SVGPathElement>) => {
                      const { x, y } = tipCoords(e);
                      const title =
                        choroplethCountryLabel(id, g.properties, locale) || labels.worldMapUnknownRegion;
                      const line =
                        cnt > 0
                          ? labels.worldMapTooltipVisits.replace(/\{\{count\}\}/g, nf.format(cnt))
                          : labels.worldMapTooltipNoVisits;
                      setTip({ x, y, title, line });
                    }}
                    onMouseMove={(e: ReactMouseEvent<SVGPathElement>) => {
                      const { x, y } = tipCoords(e);
                      setTip((cur) => (cur ? { ...cur, x, y } : null));
                    }}
                    onMouseLeave={() => setTip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.chartWorldMapLegend}</p>
      {!hasCountryHits ? (
        <p
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/45 px-3 py-2 text-xs text-[var(--color-muted-foreground)]"
          role="status"
        >
          {labels.worldMapNoCountryData}
        </p>
      ) : null}
      {top.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-[var(--color-primary)]">{labels.trafficTopCountries}</p>
          <ol className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-muted-foreground)]">
            {top.map((r) => (
              <li key={r.country}>
                {r.country}: {r.cnt}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
