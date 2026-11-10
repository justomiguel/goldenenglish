"use client";

import { useEffect, useState } from "react";

/** A page puts this attribute on its hero to hold the install sheet. */
export const PWA_INSTALL_DEFER_ATTR = "data-pwa-install-defer";

function heroMarker(): Element | null {
  return document.querySelector(`[${PWA_INSTALL_DEFER_ATTR}]`);
}

/** The hero is above the screen, or no longer on the page. */
function pastHero(): boolean {
  const marker = heroMarker();
  return !marker || marker.getBoundingClientRect().bottom <= 0;
}

function dialogOpen(): boolean {
  return document.querySelector("dialog[open]") !== null;
}

/**
 * True when the install sheet may show. Pages without the mark are ready at
 * once. With the mark, the sheet waits until the hero is above the screen and
 * no dialog is open, so the first screen shows one layer at a time.
 * Once ready, it stays ready.
 *
 * The check reads the marker on every scroll instead of observing one node:
 * hydration and surface gates can replace the hero element after mount.
 */
export function usePwaInstallDeferral(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!heroMarker()) {
      queueMicrotask(() => setReady(true));
      return;
    }
    const check = () => {
      if (!pastHero() || dialogOpen()) return;
      setReady(true);
      window.removeEventListener("scroll", check);
    };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return ready;
}
