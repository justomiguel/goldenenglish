"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import type { BlogArticleListItem } from "@/lib/blog/server";
import type { BlogArticleCardLabels } from "@/components/molecules/BlogArticleCard";
import { BlogIndexDesktop } from "@/components/desktop/organisms/BlogIndexDesktop";
import { BlogIndexMobile } from "@/components/pwa/organisms/BlogIndexMobile";

interface BlogIndexSurfaceEntryProps {
  locale: string;
  rows: BlogArticleListItem[];
  labels: {
    title: string;
    empty: string;
  } & BlogArticleCardLabels;
}

export function BlogIndexSurfaceEntry({ locale, rows, labels }: BlogIndexSurfaceEntryProps) {
  return (
    <SurfaceMountGate
      skeleton={
        <div className="space-y-3">
          <div className="h-8 w-40 animate-pulse rounded bg-[var(--color-muted)]" />
          <div className="h-24 animate-pulse rounded bg-[var(--color-muted)]" />
        </div>
      }
      desktop={
        <BlogIndexDesktop locale={locale} rows={rows} labels={labels} />
      }
      narrow={() => <BlogIndexMobile locale={locale} rows={rows} labels={labels} />}
    />
  );
}
