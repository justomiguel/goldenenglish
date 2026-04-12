"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { scheduleIdle } from "@/lib/analytics/scheduleIdle";
import {
  flushOfflineAnalyticsQueue,
  trackPageView,
  trackSessionStart,
} from "@/lib/analytics/trackClient";

export function AnalyticsProvider() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      scheduleIdle(() => {
        flushOfflineAnalyticsQueue();
        if (typeof window !== "undefined" && !sessionStorage.getItem("ge_analytics_session")) {
          sessionStorage.setItem("ge_analytics_session", "1");
          trackSessionStart();
        }
      });
    });
    const onOnline = () => flushOfflineAnalyticsQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session) return;
      const qs = searchParams.toString();
      scheduleIdle(() => {
        if (!cancelled) trackPageView(pathname, qs);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  return null;
}
