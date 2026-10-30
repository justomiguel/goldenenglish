"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface BlogMetricBeaconProps {
  kind: "list_view" | "article_view";
  articleId?: string | null;
  source?: "index" | "other" | null;
  locale: string;
  stripFromIndex?: boolean;
}

export function BlogMetricBeacon({
  kind,
  articleId = null,
  source = null,
  locale,
  stripFromIndex = false,
}: BlogMetricBeaconProps) {
  const router = useRouter();

  useEffect(() => {
    void fetch("/api/blog/metrics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, articleId, source, locale }),
    }).catch(() => undefined);
    if (!stripFromIndex) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("from") !== "index") return;
    url.searchParams.delete("from");
    const next = `${url.pathname}${url.search}`;
    router.replace(next);
  }, [articleId, kind, locale, router, source, stripFromIndex]);

  return null;
}
