import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isAllowedSectionImageUpload,
  MAX_SECTION_IMAGE_BYTES,
  SECTION_SHARE_FALLBACK_PATH,
  sectionReferenceImagePublicUrl,
} from "@/lib/register/sectionReferenceImage";

describe("sectionReferenceImage", () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
  });

  it("builds a public storage url and rejects empty paths", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    expect(sectionReferenceImagePublicUrl("sec/1.jpg")).toBe(
      "https://proj.supabase.co/storage/v1/object/public/section-images/sec/1.jpg",
    );
    expect(sectionReferenceImagePublicUrl("  ")).toBeNull();
    expect(sectionReferenceImagePublicUrl(null)).toBeNull();
  });

  it("accepts jpeg/png/webp under 2 MiB and rejects the rest", () => {
    expect(isAllowedSectionImageUpload("image/jpeg", 100)).toBe(true);
    expect(isAllowedSectionImageUpload("image/png", MAX_SECTION_IMAGE_BYTES)).toBe(true);
    expect(isAllowedSectionImageUpload("image/webp", 1)).toBe(true);
    expect(isAllowedSectionImageUpload("image/svg+xml", 100)).toBe(false);
    expect(isAllowedSectionImageUpload("image/jpeg", 0)).toBe(false);
    expect(isAllowedSectionImageUpload("image/jpeg", MAX_SECTION_IMAGE_BYTES + 1)).toBe(
      false,
    );
  });

  it("ships the generic share fallback under public/", () => {
    expect(SECTION_SHARE_FALLBACK_PATH).toBe("/images/section-share-fallback.png");
    expect(
      existsSync(join(process.cwd(), "public", "images", "section-share-fallback.png")),
    ).toBe(true);
  });
});
