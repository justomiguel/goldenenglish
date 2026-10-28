import type { Metadata } from "next";
import { absoluteUrlForRequest } from "@/lib/site/requestPublicUrl";

export async function toAbsoluteShareUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return (await absoluteUrlForRequest(path))?.toString() ?? trimmed;
}

export async function buildPublicShareMetadata(input: {
  title: string;
  description: string;
  path: string;
  coverImageUrl?: string | null;
  fallbackImageUrl?: string | null;
  ogType?: "website" | "article";
  locale?: string;
  /** Route-level `opengraph-image.tsx` supplies the image; keep large card without inline URLs. */
  deferShareImageToFileMetadata?: boolean;
}): Promise<Pick<Metadata, "openGraph" | "twitter">> {
  const shareImageRaw = input.coverImageUrl ?? input.fallbackImageUrl ?? null;
  const shareImage =
    input.deferShareImageToFileMetadata || !shareImageRaw
      ? null
      : await toAbsoluteShareUrl(shareImageRaw);
  const useLargeCard = Boolean(shareImage || input.deferShareImageToFileMetadata);
  const pageUrl = (await absoluteUrlForRequest(input.path))?.toString() ?? input.path;

  return {
    openGraph: {
      type: input.ogType ?? "website",
      title: input.title,
      description: input.description,
      url: pageUrl,
      ...(input.locale ? { locale: input.locale } : {}),
      ...(shareImage ? { images: [{ url: shareImage, alt: input.title }] } : {}),
    },
    twitter: {
      card: useLargeCard ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}
