"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMapsPlacesScript } from "@/lib/client/loadGoogleMapsPlacesScript";
import { readGoogleMapsMapId } from "@/lib/site/googleMapsMapId";
import { useMapsGeocodedLatLng } from "@/hooks/useMapsGeocodedLatLng";

export interface ProfileHomeAddressMapLabels {
  mapPreviewEmpty: string;
  mapPreviewLoading: string;
  mapPreviewUnavailable: string;
}

export interface ProfileHomeAddressMapProps {
  apiKey: string;
  addressText: string;
  placeId: string | null;
  labels: ProfileHomeAddressMapLabels;
  /** Visually hidden heading for the map region (a11y). */
  title: string;
}

type LatLng = { lat: number; lng: number };

type MapInstance = {
  setCenter: (p: LatLng) => void;
};

type MapCtor = new (
  el: HTMLElement,
  opts: {
    center: LatLng;
    zoom: number;
    mapId: string;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  },
) => MapInstance;

type AdvMarkerInstance = {
  position: LatLng;
};

type AdvMarkerCtor = new (opts: { map: unknown; position: LatLng }) => AdvMarkerInstance;

type MarkerLibrary = {
  AdvancedMarkerElement: AdvMarkerCtor;
};

type MapsRoot = {
  Map: MapCtor;
  importLibrary?: (name: string) => Promise<MarkerLibrary>;
};

export function ProfileHomeAddressMap({ apiKey, addressText, placeId, labels, title }: ProfileHomeAddressMapProps) {
  const geo = useMapsGeocodedLatLng(apiKey, addressText, placeId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<MapInstance | null>(null);
  const markerInst = useRef<AdvMarkerInstance | null>(null);

  const lat = geo.status === "ok" ? geo.lat : undefined;
  const lng = geo.status === "ok" ? geo.lng : undefined;

  useEffect(() => {
    if (geo.status !== "ok") {
      markerInst.current = null;
      mapInst.current = null;
    }
  }, [geo.status]);

  useEffect(() => {
    if (!apiKey || lat === undefined || lng === undefined) return;
    const pos = { lat, lng };
    let cancelled = false;

    void loadGoogleMapsPlacesScript(apiKey).then(async () => {
      if (cancelled || !wrapRef.current) return;
      const gm = (globalThis as unknown as { google?: { maps?: MapsRoot } }).google?.maps;
      if (!gm?.Map || typeof gm.importLibrary !== "function") return;

      const { AdvancedMarkerElement } = (await gm.importLibrary("marker")) as MarkerLibrary;
      if (cancelled || !wrapRef.current) return;

      const mapId = readGoogleMapsMapId();

      if (!mapInst.current) {
        mapInst.current = new gm.Map(wrapRef.current, {
          center: pos,
          zoom: 16,
          mapId,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        markerInst.current = new AdvancedMarkerElement({
          map: mapInst.current,
          position: pos,
        });
      } else {
        mapInst.current.setCenter(pos);
        if (markerInst.current) markerInst.current.position = pos;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [apiKey, lat, lng]);

  if (!apiKey) return null;

  return (
    <div className="space-y-2">
      <p className="sr-only">{title}</p>
      {geo.status === "empty" ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.mapPreviewEmpty}</p>
      ) : null}
      {geo.status === "loading" ? (
        <p className="text-xs text-[var(--color-muted-foreground)]" aria-live="polite">
          {labels.mapPreviewLoading}
        </p>
      ) : null}
      {geo.status === "error" ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.mapPreviewUnavailable}</p>
      ) : null}
      {geo.status === "ok" ? (
        <div
          ref={wrapRef}
          className="h-52 w-full overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
