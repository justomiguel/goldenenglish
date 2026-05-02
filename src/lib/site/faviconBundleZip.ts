import { unzipSync } from "fflate";

/** Canonical filenames (favicon.io style). */
export const FAVICON_BUNDLE_REQUIRED_FILES = [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
] as const;

export const FAVICON_BUNDLE_OPTIONAL_FILES = ["site.webmanifest"] as const;

const ALLOWED_CANONICAL = new Map<string, string>();
for (const f of [
  ...FAVICON_BUNDLE_REQUIRED_FILES,
  ...FAVICON_BUNDLE_OPTIONAL_FILES,
]) {
  ALLOWED_CANONICAL.set(f.toLowerCase(), f);
}

/** Max sum of uncompressed bundle payloads (defense in depth). */
export const FAVICON_BUNDLE_MAX_UNCOMPRESSED_BYTES = 3 * 1024 * 1024;

export type ParseFaviconBundleZipOk = {
  ok: true;
  /** Canonical filename → bytes */
  files: Map<string, Uint8Array>;
};

export type ParseFaviconBundleZipErr = {
  ok: false;
  code:
    | "zip_invalid"
    | "zip_empty"
    | "unsafe_path"
    | "duplicate_file"
    | "unknown_structure"
    | "missing_required"
    | "bundle_too_large"
    | "entry_too_large";
};

export type ParseFaviconBundleZipResult =
  | ParseFaviconBundleZipOk
  | ParseFaviconBundleZipErr;

function zipBasename(zipPath: string): string | null {
  const n = zipPath.replace(/\\/g, "/").trim();
  if (!n || n.startsWith("/")) return null;
  const parts = n.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  for (const part of parts) {
    if (part === "." || part === "..") return null;
  }
  const base = parts[parts.length - 1]?.trim();
  return base && base.length > 0 ? base : null;
}

function sniffLikelyZip(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 4) return false;
  // PK\x03\x04 local file header
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

/**
 * Extracts a favicon.io-style bundle from an in-memory ZIP.
 * Ignores unknown extra files; rejects ambiguous duplicates for allowed names.
 */
export function parseFaviconBundleZip(
  zipBytes: Uint8Array,
  /** Per-file ceiling (e.g. `LANDING_MEDIA_MAX_BYTES`). */
  maxEntryBytes: number,
): ParseFaviconBundleZipResult {
  if (!zipBytes.byteLength) return { ok: false, code: "zip_empty" };
  if (!sniffLikelyZip(zipBytes)) return { ok: false, code: "zip_invalid" };

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zipBytes);
  } catch {
    return { ok: false, code: "zip_invalid" };
  }

  const keys = Object.keys(entries).filter((k) => !k.endsWith("/"));
  if (keys.length === 0) return { ok: false, code: "zip_empty" };

  const files = new Map<string, Uint8Array>();
  let total = 0;

  for (const rawPath of keys) {
    const base = zipBasename(rawPath);
    if (!base) return { ok: false, code: "unsafe_path" };
    const canon = ALLOWED_CANONICAL.get(base.toLowerCase());
    if (!canon) continue;

    const data = entries[rawPath];
    if (!data?.byteLength) continue;
    if (data.byteLength > maxEntryBytes)
      return { ok: false, code: "entry_too_large" };

    if (files.has(canon)) return { ok: false, code: "duplicate_file" };
    files.set(canon, data);
    total += data.byteLength;
    if (total > FAVICON_BUNDLE_MAX_UNCOMPRESSED_BYTES)
      return { ok: false, code: "bundle_too_large" };
  }

  if (files.size === 0) return { ok: false, code: "unknown_structure" };

  for (const req of FAVICON_BUNDLE_REQUIRED_FILES) {
    if (!files.has(req)) return { ok: false, code: "missing_required" };
  }

  return { ok: true, files };
}

export function faviconBundleFileContentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webmanifest")) return "application/manifest+json";
  return "application/octet-stream";
}
