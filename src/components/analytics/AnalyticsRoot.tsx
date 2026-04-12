"use client";

import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { PublicTrafficBeacon } from "@/components/analytics/PublicTrafficBeacon";

export function AnalyticsRoot({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsProvider />
        <PublicTrafficBeacon />
      </Suspense>
      {children}
    </>
  );
}
