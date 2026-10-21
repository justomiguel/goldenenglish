import "server-only";

import type { Metadata } from "next";
import { getBrandForRequest } from "@/lib/brand/server";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import {
  buildLandingMediaMap,
  resolveLandingImageSrcForTheme,
} from "@/lib/cms/resolveLandingMedia";
import { sharePreviewBundleKeyFromTemplateKind } from "@/lib/landing/sharePreviewBundleKey";
import { resolveSharePreviewLogoAbsoluteUrl } from "@/lib/landing/resolveSharePreviewLogoUrl";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { buildPublicShareMetadata, toAbsoluteShareUrl } from "@/lib/site/buildPublicShareMetadata";
import { pickHomeSharePhotoUrl } from "@/lib/site/pickHomeSharePhotoUrl";
import { pickShareImageUrl } from "@/lib/site/pickShareImageUrl";
import { buildPublicShareTitle, clipShareDescription } from "@/lib/site/publicShareText";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Home photo for share cards. `inicio` is the hero. `modalidades` is the gallery. */
export async function loadHomeSharePhotoUrl(): Promise<string | null> {
  const snapshot = await loadActiveTheme();
  const kind = snapshot?.theme.templateKind ?? "classic";
  const media = snapshot
    ? buildLandingMediaMap(snapshot.media, createLandingMediaPublicUrlBuilder())
    : null;
  const picked = pickHomeSharePhotoUrl({
    media,
    bundledInicio: resolveLandingImageSrcForTheme(kind, "inicio", "1.png", media ?? undefined),
    bundledGallery: resolveLandingImageSrcForTheme(kind, "modalidades", "1.png", media ?? undefined),
  });
  if (!picked) return null;
  const absolute = toAbsoluteShareUrl(picked);
  const fromMedia = media ? [...media.values()].some((url) => url.trim() === picked.trim()) : false;
  if (fromMedia) return absolute;
  return (await urlExists(absolute)) ? absolute : null;
}

export async function loadShareLogoUrl(): Promise<string | null> {
  const origin = getPublicSiteUrl()?.origin;
  if (!origin) return null;
  const [brand, theme] = await Promise.all([getBrandForRequest(), loadActiveTheme()]);
  const bundle = sharePreviewBundleKeyFromTemplateKind(theme?.theme.templateKind);
  return resolveSharePreviewLogoAbsoluteUrl(origin, bundle, brand);
}

export async function loadShareImageChain(pageImage?: string | null): Promise<string | null> {
  const [home, logo] = await Promise.all([loadHomeSharePhotoUrl(), loadShareLogoUrl()]);
  return pickShareImageUrl(pageImage, home, logo);
}

export async function buildResolvedPublicShareMetadata(input: {
  what: string;
  academyName: string;
  description: string;
  path: string;
  pageImageUrl?: string | null;
  robots?: Metadata["robots"];
  ogType?: "website" | "article";
  absoluteTitle?: boolean;
  deferShareImageToFileMetadata?: boolean;
}): Promise<Metadata> {
  const title = input.absoluteTitle
    ? input.academyName.trim()
    : buildPublicShareTitle(input.what, input.academyName);
  const description = clipShareDescription(input.description);
  const image = input.deferShareImageToFileMetadata
    ? null
    : await loadShareImageChain(input.pageImageUrl);
  return {
    title: { absolute: title },
    description,
    ...(input.robots ? { robots: input.robots } : {}),
    alternates: { canonical: input.path },
    ...buildPublicShareMetadata({
      title,
      description,
      path: input.path,
      coverImageUrl: image,
      ogType: input.ogType,
      deferShareImageToFileMetadata: input.deferShareImageToFileMetadata,
    }),
  };
}
