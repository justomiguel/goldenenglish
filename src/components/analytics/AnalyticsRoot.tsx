"use client";

import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";

/** Public traffic hits are recorded in middleware (GET + UA); no client beacon — avoids double counts and captures bots without JS. */

export function AnalyticsRoot({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsProvider />
      </Suspense>
      {children}
    </>
  );
}
