/**
 * Loads Maps JavaScript API with Places + Marker libraries once per tab (Places autocomplete + AdvancedMarker map preview).
 * Browser-only; callers must guard SSR.
 */
let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsPlacesScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("maps_script_ssr"));
  }
  const w = window as Window & {
    google?: {
      maps?: {
        importLibrary?: (name: string) => Promise<unknown>;
        places?: unknown;
        marker?: unknown;
      };
    };
  };
  const maps = w.google?.maps as
    | {
        importLibrary?: (name: string) => Promise<unknown>;
        places?: unknown;
        marker?: unknown;
      }
    | undefined;
  if (maps && (typeof maps.importLibrary === "function" || maps.places || maps.marker)) {
    return Promise.resolve();
  }
  if (!apiKey) return Promise.reject(new Error("maps_script_no_key"));

  if (!loadPromise) {
    loadPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&libraries=places,marker`;
      s.onload = () => resolve();
      s.onerror = () => {
        loadPromise = null;
        reject(new Error("maps_script_error"));
      };
      document.head.appendChild(s);
    });
  }

  return loadPromise;
}
