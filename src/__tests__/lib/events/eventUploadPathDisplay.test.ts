import { describe, expect, it } from "vitest";
import {
  basenameFromStoragePath,
  shouldRenderEventFieldAsImage,
} from "@/lib/events/eventUploadPathDisplay";

describe("eventUploadPathDisplay", () => {
  it("returns basename from nested storage path", () => {
    expect(basenameFromStoragePath("evt/staging/abc/field/photo-1.jpg")).toBe("photo-1.jpg");
  });

  it("treats image field type as image even without extension", () => {
    expect(shouldRenderEventFieldAsImage("image", "evt/staging/x/file.bin")).toBe(true);
  });

  it("treats file field with image extension as image", () => {
    expect(shouldRenderEventFieldAsImage("file", "evt/a/b/c.png")).toBe(true);
    expect(shouldRenderEventFieldAsImage("file", "evt/a/b/c.pdf")).toBe(false);
  });
});
