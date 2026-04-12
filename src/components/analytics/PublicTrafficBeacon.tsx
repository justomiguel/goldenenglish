"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPublicTrafficHit } from "@/lib/analytics/trackPublicTrafficHit";

/**
 * Registers every locale route view (guest, bot, or signed-in) for traffic totals.
 * Product analytics (`user_events`) stay on {@link AnalyticsProvider} for signed-in flows.
 */
export function PublicTrafficBeacon() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (!pathname) return;
    trackPublicTrafficHit(pathname);
  }, [pathname]);

  return null;
}
