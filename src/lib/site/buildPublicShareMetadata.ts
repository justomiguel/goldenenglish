import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site/publicUrl";

export function toAbsoluteShareUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return absoluteUrl(path)?.toString() ?? trimmed;
}

export function buildPublicShareMetadata(input: {
  title: string;
  description: string;
  path: string;
  coverImageUrl?: string | null;
  fallbackImageUrl?: string | null;
  ogType?: "website" | "article";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const shareImageRaw = input.coverImageUrl ?? input.fallbackImageUrl ?? null;
  const shareImage = shareImageRaw ? toAbsoluteShareUrl(shareImageRaw) : null;
  const pageUrl = absoluteUrl(input.path)?.toString() ?? input.path;

  return {
    openGraph: {
      type: input.ogType ?? "website",
      title: input.title,
      description: input.description,
      url: pageUrl,
      ...(shareImage ? { images: [{ url: shareImage, alt: input.title }] } : {}),
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}
