import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BrandPublic } from "@/lib/brand/server";
import { logServerWarn } from "@/lib/logging/serverActionLog";

function isPng(bytes: Uint8Array): boolean {
  return bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

function publicFile(src: string): string | null {
  if (!src.startsWith("/") || src.includes("\0")) return null;
  const root = path.resolve(process.cwd(), "public");
  const file = path.resolve(root, src.slice(1));
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) return null;
  return file;
}

async function loadBytes(src: string): Promise<Uint8Array | null> {
  const trimmed = src.trim();
  if (!trimmed) return null;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const response = await fetch(trimmed);
      if (!response.ok) return null;
      return new Uint8Array(await response.arrayBuffer());
    }
    const file = publicFile(trimmed);
    if (!file) return null;
    return new Uint8Array(await readFile(file));
  } catch (err) {
    void logServerWarn("pwa.installIcon", {
      code: "install_icon_unreadable",
      err: err instanceof Error ? err.name : "read_failed",
    });
    return null;
  }
}

/** First PNG among the logo and the favicon. Null when neither decodes as PNG. */
export async function readInstallIconSource(
  brand: Pick<BrandPublic, "logoPath" | "faviconPath">,
): Promise<Uint8Array | null> {
  for (const src of [brand.logoPath, brand.faviconPath]) {
    const bytes = await loadBytes(src);
    if (bytes && isPng(bytes)) return bytes;
  }
  return null;
}
