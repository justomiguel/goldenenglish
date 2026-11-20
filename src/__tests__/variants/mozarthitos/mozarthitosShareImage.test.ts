import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mozarthitosSectionImageSrc } from "@/variants/owned/mozarthitos/pieces/mozarthitosLandingImages";

function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    const length = bytes.readUInt16BE(offset + 2);
    offset += 2 + length;
  }
  return null;
}

describe("mozarthitos share image", () => {
  it("keeps the wordmark on inicio 1 and maps the share card to og.jpg", () => {
    expect(mozarthitosSectionImageSrc("inicio", "1.png")).toBe(
      "/images/mozarthitos/inicio/1.png",
    );
    expect(mozarthitosSectionImageSrc("inicio", "og.jpg")).toBe("/images/mozarthitos/og.jpg");
  });

  it("stores an opaque 1200 by 630 JPEG", () => {
    const bytes = readFileSync(join(process.cwd(), "public/images/mozarthitos/og.jpg"));
    expect(bytes.subarray(0, 3).toString("hex")).toBe("ffd8ff");
    expect(jpegSize(bytes)).toEqual({ width: 1200, height: 630 });
  });
});
