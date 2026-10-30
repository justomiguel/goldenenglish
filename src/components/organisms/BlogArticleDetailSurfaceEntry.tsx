"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { BlogArticleDetailDesktop } from "@/components/desktop/organisms/BlogArticleDetailDesktop";
import { BlogArticleDetailMobile } from "@/components/pwa/organisms/BlogArticleDetailMobile";
import type { BlogAttachment } from "@/lib/blog/attachments";
import type { BlogArticlePublicExtrasProps } from "@/components/molecules/BlogArticlePublicExtras";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";

interface BlogArticleDetailSurfaceEntryProps {
  locale: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  coverImageUrl: string | null;
  coverUnoptimized: boolean;
  attachments: BlogAttachment[];
  attachmentsTitle: string;
  heroLabels: {
    backToBlog: string;
    articleEyebrow: string;
    publishedDateAria: string;
  };
  displayDate: string;
  displayDateIso: string;
  viewsLabel: string;
  richContentLabels: RichContentDisplayLabels;
  shareUrl?: string;
  shareLabel?: string;
  shareCopiedLabel?: string;
  publicExtras?: Omit<BlogArticlePublicExtrasProps, "fullWidth">;
}

export function BlogArticleDetailSurfaceEntry({
  locale,
  title,
  excerpt,
  bodyHtml,
  coverImageUrl,
  coverUnoptimized,
  attachments,
  attachmentsTitle,
  heroLabels,
  displayDate,
  displayDateIso,
  viewsLabel,
  richContentLabels,
  shareUrl,
  shareLabel,
  shareCopiedLabel,
  publicExtras,
}: BlogArticleDetailSurfaceEntryProps) {
  const detailProps = {
    locale,
    title,
    excerpt,
    bodyHtml,
    coverImageUrl,
    coverUnoptimized,
    attachments,
    attachmentsTitle,
    heroLabels,
    displayDate,
    displayDateIso,
    viewsLabel,
    richContentLabels,
    shareUrl,
    shareLabel,
    shareCopiedLabel,
    publicExtras,
  };

  return (
    <SurfaceMountGate
      skeleton={<div className="h-48 animate-pulse rounded bg-[var(--color-muted)]" />}
      desktop={<BlogArticleDetailDesktop {...detailProps} />}
      narrow={() => <BlogArticleDetailMobile {...detailProps} />}
    >
    </SurfaceMountGate>
  );
}
