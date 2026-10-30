import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { icoFromPng, solidPng } from "@/lib/brand/encodePng";
import { letterMarkPng } from "@/lib/brand/letterMarkPng";
import { scalePngNearest } from "@/lib/brand/scalePng";
import { shareCardPng } from "@/lib/brand/shareCardPng";
import {
  GENERIC_KIND_RGB,
  type GenericInstituteKind,
} from "@/lib/theme/genericInstituteTemplates";

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62})$/;

export interface InstituteImageBytes {
  bytes: Uint8Array;
  contentType: string;
}

export interface WrittenInstituteImage {
  fileName: string;
  bytes: Uint8Array;
  contentType: string;
}

export interface InstitutePublicImagePack {
  logoPath: string | null;
  faviconPath: string;
  sharePath: string;
  files: WrittenInstituteImage[];
}

function imagesDir(root: string, slug: string): string {
  if (!SLUG.test(slug)) {
    throw new Error("invalid_slug");
  }
  const base = path.resolve(root, "public", "images");
  const dir = path.resolve(base, slug);
  if (dir !== path.join(base, slug)) {
    throw new Error("invalid_slug");
  }
  return dir;
}

function isPng(file: InstituteImageBytes): boolean {
  return file.contentType.toLowerCase().includes("png") || file.bytes[0] === 0x89;
}

function rasterExt(contentType: string): "png" | "jpg" | "webp" | null {
  const type = contentType.toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";
  return null;
}

function firstPng(
  files: Array<InstituteImageBytes | null | undefined>,
): InstituteImageBytes | null {
  return files.find((file) => file && isPng(file)) ?? null;
}

function firstRaster(
  files: Array<InstituteImageBytes | null | undefined>,
): InstituteImageBytes | null {
  return files.find((file) => file && rasterExt(file.contentType)) ?? null;
}

/** Writes `/public/images/<slug>/` from the admin name, tagline, and uploads. */
export function writeInstitutePublicImagePack(input: {
  root: string;
  slug: string;
  name: string;
  description: string;
  kind: GenericInstituteKind;
  faviconMode?: "image" | "letter";
  logo?: InstituteImageBytes | null;
  favicon?: InstituteImageBytes | null;
  hero?: InstituteImageBytes | null;
}): InstitutePublicImagePack {
  const dir = imagesDir(input.root, input.slug);
  mkdirSync(dir, { recursive: true });
  const colors = GENERIC_KIND_RGB[input.kind];
  const files: WrittenInstituteImage[] = [];

  const put = (fileName: string, bytes: Uint8Array, contentType: string) => {
    writeFileSync(path.join(dir, fileName), bytes);
    files.push({ fileName, bytes, contentType });
  };

  const iconPng = firstPng([input.favicon, input.logo, input.hero]);
  const iconBytes =
    input.faviconMode === "letter"
      ? letterMarkPng({ name: input.name, size: 512, ink: colors.ink, paper: colors.paper })
      : (iconPng?.bytes ?? solidPng(512, 512, colors.ink));
  const sized = (px: number) => scalePngNearest(iconBytes, px, px) ?? iconBytes;
  put("favicon-16x16.png", sized(16), "image/png");
  put("favicon-32x32.png", sized(32), "image/png");
  put("apple-touch-icon.png", sized(180), "image/png");
  put("android-chrome-192x192.png", sized(192), "image/png");
  put("android-chrome-512x512.png", sized(512), "image/png");
  put("favicon.ico", icoFromPng(sized(32)), "image/x-icon");

  let logoPath: string | null = null;
  if (input.logo) {
    const ext = rasterExt(input.logo.contentType) ?? (input.logo.contentType.includes("svg") ? "svg" : "bin");
    const fileName = `logo.${ext}`;
    put(fileName, input.logo.bytes, input.logo.contentType);
    logoPath = `/images/${input.slug}/${fileName}`;
  }

  const photo = firstRaster([input.hero, input.logo, input.favicon]);
  const photoExt = photo ? rasterExt(photo.contentType) : null;
  let sharePath = `/images/${input.slug}/og.png`;
  if (photo && photoExt && photoExt !== "png") {
    put(`og.${photoExt}`, photo.bytes, photo.contentType);
    sharePath = `/images/${input.slug}/og.${photoExt}`;
  } else if (photo && photoExt === "png") {
    put("og.png", photo.bytes, "image/png");
  } else {
    put(
      "og.png",
      shareCardPng({
        name: input.name,
        description: input.description,
        ink: colors.ink,
        paper: colors.paper,
      }),
      "image/png",
    );
  }

  return {
    logoPath,
    faviconPath: `/images/${input.slug}/favicon.ico`,
    sharePath,
    files,
  };
}

export function removeInstitutePublicImageDir(root: string, slug: string): void {
  rmSync(imagesDir(root, slug), { recursive: true, force: true });
}
