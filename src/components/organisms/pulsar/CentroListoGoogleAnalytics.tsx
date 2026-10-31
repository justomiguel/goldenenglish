"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  installCentrolistoGtag,
  isCentrolistoMarketingPath,
  resolveCentrolistoClick,
  trackCentrolistoGaEvent,
} from "@/lib/pulsar/centrolistoAnalytics";

export interface CentroListoGoogleAnalyticsProps {
  measurementId: string;
}

function CentroListoGaHits({ measurementId }: CentroListoGoogleAnalyticsProps) {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();
  const marketing = isCentrolistoMarketingPath(pathname);

  useEffect(() => {
    if (!marketing) return;
    installCentrolistoGtag(measurementId);
  }, [marketing, measurementId]);

  useEffect(() => {
    if (!marketing) return;
    const pagePath = query ? `${pathname}?${query}` : pathname;
    trackCentrolistoGaEvent("page_view", {
      page_path: pagePath,
      page_location: `${window.location.origin}${pagePath}`,
      page_title: document.title,
    });
  }, [marketing, pathname, query]);

  useEffect(() => {
    if (!marketing) return;
    function onClick(event: MouseEvent) {
      const click = resolveCentrolistoClick(event.target, window.location.origin);
      if (!click) return;
      trackCentrolistoGaEvent("cl_click", {
        link_url: click.linkUrl,
        link_text: click.linkText,
        outbound: click.outbound,
      });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [marketing]);

  if (!marketing) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  );
}

export function CentroListoGoogleAnalytics({ measurementId }: CentroListoGoogleAnalyticsProps) {
  return (
    <Suspense fallback={null}>
      <CentroListoGaHits measurementId={measurementId} />
    </Suspense>
  );
}
