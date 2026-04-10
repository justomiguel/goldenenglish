/** Aligned with Tailwind default `md` breakpoint (767px / max-md). */
const MOBILE_MEDIA = "(max-width: 767px)";
const STANDALONE_MEDIA = "(display-mode: standalone)";

export type AppSurface = "web-desktop" | "web-mobile" | "pwa-mobile";

export function isIosStandalone(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function computeAppSurface(): AppSurface {
  if (typeof window === "undefined") return "web-desktop";
  const mobile = window.matchMedia(MOBILE_MEDIA).matches;
  const standalone =
    window.matchMedia(STANDALONE_MEDIA).matches || isIosStandalone();
  if (mobile && standalone) return "pwa-mobile";
  if (mobile) return "web-mobile";
  return "web-desktop";
}

export function subscribeAppSurface(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mobile = window.matchMedia(MOBILE_MEDIA);
  const standalone = window.matchMedia(STANDALONE_MEDIA);
  const handler = () => onChange();
  mobile.addEventListener("change", handler);
  standalone.addEventListener("change", handler);
  window.addEventListener("orientationchange", handler);
  return () => {
    mobile.removeEventListener("change", handler);
    standalone.removeEventListener("change", handler);
    window.removeEventListener("orientationchange", handler);
  };
}

export function getServerAppSurfaceSnapshot(): AppSurface {
  return "web-desktop";
}

export function getClientAppSurfaceSnapshot(): AppSurface {
  return computeAppSurface();
}
