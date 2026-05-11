import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadGoogleMapsPlacesScript } from "@/lib/client/loadGoogleMapsPlacesScript";
import { useMapsGeocodedLatLng } from "@/hooks/useMapsGeocodedLatLng";

vi.mock("@/lib/client/loadGoogleMapsPlacesScript", () => ({
  loadGoogleMapsPlacesScript: vi.fn(() => Promise.resolve()),
}));

const loadMock = vi.mocked(loadGoogleMapsPlacesScript);

describe("useMapsGeocodedLatLng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as { google?: unknown }).google;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty when api key missing", () => {
    const { result } = renderHook(() => useMapsGeocodedLatLng("", "Somewhere", null));
    expect(result.current).toEqual({ status: "empty" });
    expect(loadMock).not.toHaveBeenCalled();
  });

  it("returns empty when no placeId and address trimmed empty", () => {
    const { result } = renderHook(() => useMapsGeocodedLatLng("k", "   ", null));
    expect(result.current).toEqual({ status: "empty" });
  });

  it("geocodes by placeId and returns ok", async () => {
    class GeoOk {
      geocode(
        _req: unknown,
        cb: (r: unknown[] | null, s: string) => void,
      ) {
        cb(
          [
            {
              geometry: {
                location: { lat: () => -33.1, lng: () => -70.2 },
              },
            },
          ],
          "OK",
        );
      }
    }
    (window as unknown as { google: unknown }).google = {
      maps: { Geocoder: GeoOk },
    };

    const { result } = renderHook(() => useMapsGeocodedLatLng("k", "", "place-1"));

    await waitFor(() => {
      expect(result.current).toEqual({ status: "ok", lat: -33.1, lng: -70.2 });
    });
    expect(loadMock).toHaveBeenCalledWith("k");
  });

  it("returns error when Geocoder missing after load", async () => {
    const { result } = renderHook(() => useMapsGeocodedLatLng("k", "", "p2"));

    await waitFor(() => {
      expect(result.current).toEqual({ status: "error" });
    });
  });

  it("returns error on non-OK geocode", async () => {
    class GeoBad {
      geocode(_req: unknown, cb: (r: unknown[] | null, s: string) => void) {
        cb([], "ZERO_RESULTS");
      }
    }
    (window as unknown as { google: unknown }).google = {
      maps: { Geocoder: GeoBad },
    };

    const { result } = renderHook(() => useMapsGeocodedLatLng("k", "", "p3"));

    await waitFor(() => {
      expect(result.current).toEqual({ status: "error" });
    });
  });

  it("geocodes by address when placeId is null", async () => {
    class GeoAddr {
      geocode(
        req: { address?: string },
        cb: (r: unknown[] | null, s: string) => void,
      ) {
        expect(req.address).toBe("Valparaíso");
        cb([{ geometry: { location: { lat: () => 1, lng: () => 2 } } }], "OK");
      }
    }
    (window as unknown as { google: unknown }).google = {
      maps: { Geocoder: GeoAddr },
    };

    const { result } = renderHook(() => useMapsGeocodedLatLng("k", "Valparaíso", null));

    await waitFor(() => {
      expect(result.current).toEqual({ status: "ok", lat: 1, lng: 2 });
    });
  });

  it("returns error when result has no location", async () => {
    class GeoNoLoc {
      geocode(_req: unknown, cb: (r: unknown[] | null, s: string) => void) {
        cb([{}], "OK");
      }
    }
    (window as unknown as { google: unknown }).google = {
      maps: { Geocoder: GeoNoLoc },
    };

    const { result } = renderHook(() => useMapsGeocodedLatLng("k", "", "p-loc"));

    await waitFor(() => {
      expect(result.current).toEqual({ status: "error" });
    });
  });
});
