"use client";

import { useSyncExternalStore } from "react";

/** Aligned with Tailwind default `md` breakpoint (768px). */
const MOBILE_MEDIA = "(max-width: 767px)";
const STANDALONE_MEDIA = "(display-mode: standalone)";

export type AppSurface = "web-desktop" | "web-mobile" | "pwa-mobile";

function isIosStandalone(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function computeSurface(): AppSurface {
  if (typeof window === "undefined") return "web-desktop";
  const mobile = window.matchMedia(MOBILE_MEDIA).matches;
  const standalone =
    window.matchMedia(STANDALONE_MEDIA).matches || isIosStandalone();
  if (mobile && standalone) return "pwa-mobile";
  if (mobile) return "web-mobile";
  return "web-desktop";
}

function subscribe(onChange: () => void): () => void {
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

function getServerSnapshot(): AppSurface {
  return "web-desktop";
}

function getClientSnapshot(): AppSurface {
  return computeSurface();
}

export function useAppSurface(): AppSurface {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
