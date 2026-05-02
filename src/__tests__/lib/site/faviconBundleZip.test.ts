import { describe, expect, it } from "vitest";
import { zipSync } from "fflate";
import {
  parseFaviconBundleZip,
  FAVICON_BUNDLE_REQUIRED_FILES,
} from "@/lib/site/faviconBundleZip";
import { LANDING_MEDIA_MAX_BYTES } from "@/lib/cms/siteThemeLandingInputSchemas";

function tiny(): Uint8Array {
  return new Uint8Array([1, 2, 3, 4]);
}

describe("parseFaviconBundleZip", () => {
  it("accepts a flat favicon.io-style ZIP", () => {
    const entries: Record<string, Uint8Array> = {};
    for (const name of FAVICON_BUNDLE_REQUIRED_FILES) {
      entries[name] = tiny();
    }
    entries["site.webmanifest"] = new Uint8Array([123, 125]);

    const zipped = zipSync(entries);
    const parsed = parseFaviconBundleZip(zipped, LANDING_MEDIA_MAX_BYTES);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.files.size).toBe(FAVICON_BUNDLE_REQUIRED_FILES.length + 1);
      expect(parsed.files.has("favicon.ico")).toBe(true);
    }
  });

  it("accepts nested paths using basename only", () => {
    const entries: Record<string, Uint8Array> = {};
    for (const name of FAVICON_BUNDLE_REQUIRED_FILES) {
      entries[`export/${name}`] = tiny();
    }
    const zipped = zipSync(entries);
    const parsed = parseFaviconBundleZip(zipped, LANDING_MEDIA_MAX_BYTES);
    expect(parsed.ok).toBe(true);
  });

  it("rejects when favicon.ico is missing", () => {
    const entries: Record<string, Uint8Array> = {};
    for (const name of FAVICON_BUNDLE_REQUIRED_FILES) {
      if (name === "favicon.ico") continue;
      entries[name] = tiny();
    }
    const zipped = zipSync(entries);
    const parsed = parseFaviconBundleZip(zipped, LANDING_MEDIA_MAX_BYTES);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.code).toBe("missing_required");
  });

  it("rejects non-zip payloads", () => {
    const parsed = parseFaviconBundleZip(new Uint8Array([1, 2, 3]), LANDING_MEDIA_MAX_BYTES);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.code).toBe("zip_invalid");
  });
});
