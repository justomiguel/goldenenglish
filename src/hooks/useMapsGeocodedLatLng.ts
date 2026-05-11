"use client";

import { useEffect, useState } from "react";
import { loadGoogleMapsPlacesScript } from "@/lib/client/loadGoogleMapsPlacesScript";

export type MapsGeocodeState =
  | { status: "idle" }
  | { status: "empty" }
  | { status: "loading" }
  | { status: "ok"; lat: number; lng: number }
  | { status: "error" };

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

type GeocoderCtor = new () => {
  geocode: (
    req: { address?: string; placeId?: string },
    cb: (
      results: { geometry?: { location?: { lat: () => number; lng: () => number } } }[] | null,
      status: string,
    ) => void,
  ) => void;
};

/**
 * Browser-only: resolves coordinates via Maps Geocoder (needs Geocoding API on the key).
 */
export function useMapsGeocodedLatLng(
  apiKey: string,
  addressText: string,
  placeId: string | null,
): MapsGeocodeState {
  const trimmed = addressText.trim();
  const pid = placeId?.trim() ?? "";
  const debouncedAddr = useDebounced(trimmed, 520);

  const gateEmpty = !apiKey || (!pid && !debouncedAddr);
  const [fetchState, setFetchState] = useState<MapsGeocodeState>({ status: "idle" });

  useEffect(() => {
    if (gateEmpty) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setFetchState({ status: "loading" });
    });

    void loadGoogleMapsPlacesScript(apiKey).then(() => {
      if (cancelled) return;
      const Ctor = (window as unknown as { google?: { maps?: { Geocoder: GeocoderCtor } } }).google?.maps
        ?.Geocoder as GeocoderCtor | undefined;
      if (!Ctor) {
        setFetchState({ status: "error" });
        return;
      }
      const geocoder = new Ctor();
      const req = pid ? { placeId: pid } : { address: debouncedAddr };
      geocoder.geocode(req, (results, status) => {
        if (cancelled) return;
        if (status !== "OK" || !results?.[0]?.geometry?.location) {
          setFetchState({ status: "error" });
          return;
        }
        const loc = results[0].geometry!.location!;
        setFetchState({ status: "ok", lat: loc.lat(), lng: loc.lng() });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [gateEmpty, apiKey, pid, debouncedAddr]);

  return gateEmpty ? { status: "empty" } : fetchState;
}
