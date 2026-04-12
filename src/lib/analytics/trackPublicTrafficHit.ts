"use client";

import { browserOriginAbsolutePath } from "@/lib/analytics/browserOriginAbsolutePath";

function postHit(pathname: string) {
  const body = JSON.stringify({ pathname });
  const url = browserOriginAbsolutePath("/api/analytics/traffic-hit");
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {
    /* fall through */
  }
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

/** One hit per navigation; no PII in body (pathname only). */
export function trackPublicTrafficHit(pathname: string): void {
  const p = pathname.trim();
  if (!p.startsWith("/") || p.length > 2048) return;
  postHit(p);
}
