import { describe, expect, it } from "vitest";
import {
  coerceLandingMediaMime,
  isAcceptedLandingMediaMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";

describe("coerceLandingMediaMime", () => {
  it("maps image/jpg to image/jpeg", () => {
    expect(coerceLandingMediaMime("image/jpg")).toBe("image/jpeg");
    expect(coerceLandingMediaMime("IMAGE/JPG")).toBe("image/jpeg");
  });

  it("accepts canonical PNG / JPEG / WebP", () => {
    expect(coerceLandingMediaMime("image/png")).toBe("image/png");
    expect(coerceLandingMediaMime("image/jpeg")).toBe("image/jpeg");
    expect(coerceLandingMediaMime("image/webp")).toBe("image/webp");
  });

  it("rejects unsupported types", () => {
    expect(coerceLandingMediaMime("image/heic")).toBeNull();
    expect(coerceLandingMediaMime("")).toBeNull();
  });
});

describe("isAcceptedLandingMediaMime", () => {
  it("returns true for coerced jpeg", () => {
    expect(isAcceptedLandingMediaMime("image/jpg")).toBe(true);
  });
});
