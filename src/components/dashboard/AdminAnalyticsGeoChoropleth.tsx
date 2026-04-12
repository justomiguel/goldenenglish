"use client";

import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { fillForIntensity, trafficGeoRowsToIso3Counts } from "@/lib/analytics/trafficGeoChoropleth";
import type { Dictionary } from "@/types/i18n";

export type TrafficGeoRow = { country: string; cnt: number };

const GEO_URL =
  "https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/DATA/world.geojson";

type GeoJson = {
  type: string;
  features: Array<{ type: string; properties?: { name?: string }; id?: string }>;
};

/** react-simple-maps render-prop payload (package ships without types). */
type RsmGeography = { id?: string; rsmKey: string; properties?: Record<string, unknown> };

interface AdminAnalyticsGeoChoroplethProps {
  labels: Pick<
    Dictionary["admin"]["analytics"],
    "chartWorldMapLegend" | "worldMapLoading" | "worldMapError" | "trafficTopCountries"
  >;
  rows: TrafficGeoRow[];
}

export function AdminAnalyticsGeoChoropleth({ labels, rows }: AdminAnalyticsGeoChoroplethProps) {
  const [geo, setGeo] = useState<GeoJson | null>(null);
  const [loadError, setLoadError] = useState(false);
  const iso3Counts = useMemo(() => trafficGeoRowsToIso3Counts(rows), [rows]);
  const max = useMemo(() => Math.max(1, ...iso3Counts.values()), [iso3Counts]);
  const top = useMemo(
    () =>
      [...rows]
        .map((r) => ({ country: r.country, cnt: Number(r.cnt) }))
        .sort((a, b) => b.cnt - a.cnt)
        .slice(0, 8),
    [rows],
  );

  useEffect(() => {
    let cancelled = false;
    void fetch(GEO_URL)
      .then((r) => {
        if (!r.ok) throw new Error("geo");
        return r.json() as Promise<GeoJson>;
      })
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
      <div className="relative w-full min-w-0 overflow-x-auto">
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
                const id = String(g.id ?? "").toUpperCase();
                const cnt = iso3Counts.get(id) ?? 0;
                const t = cnt / max;
                const fill = fillForIntensity(t, cnt > 0);
                return (
                  <Geography
                    key={g.rsmKey}
                    geography={g}
                    fill={fill}
                    stroke="var(--color-border)"
                    strokeWidth={0.35}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", opacity: 0.88 },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.chartWorldMapLegend}</p>
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
