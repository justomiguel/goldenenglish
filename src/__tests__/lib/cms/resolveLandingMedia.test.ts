import { describe, expect, it } from "vitest";
import {
  buildLandingMediaMap,
  landingPositionFromFilename,
  resolveLandingImageSrc,
} from "@/lib/cms/resolveLandingMedia";
import type { SiteThemeMediaRow } from "@/types/theming";

const rows: SiteThemeMediaRow[] = [
  {
    id: "a",
    themeId: "t1",
    section: "inicio",
    position: 1,
    storagePath: "t1/inicio/1-foo.jpg",
    altEs: null,
    altEn: null,
  },
  {
    id: "b",
    themeId: "t1",
    section: "historia",
    position: 2,
    storagePath: "t1/historia/2-bar.png",
    altEs: null,
    altEn: null,
  },
];

const publicUrl = (path: string) =>
  path ? `https://cdn.example/storage/${path}` : null;

describe("buildLandingMediaMap", () => {
  it("indexes rows by section + position with the public URL", () => {
    const map = buildLandingMediaMap(rows, publicUrl);
    expect(map.get("inicio::1")).toBe(
      "https://cdn.example/storage/t1/inicio/1-foo.jpg",
    );
    expect(map.get("historia::2")).toBe(
      "https://cdn.example/storage/t1/historia/2-bar.png",
    );
  });

  it("ignores rows whose URL builder returns null", () => {
    const map = buildLandingMediaMap(rows, () => null);
    expect(map.size).toBe(0);
  });

  it("ignores rows with non-positive positions", () => {
    const broken: SiteThemeMediaRow[] = [
      { ...rows[0]!, position: 0 },
      { ...rows[1]!, position: Number.NaN },
    ];
    const map = buildLandingMediaMap(broken, publicUrl);
    expect(map.size).toBe(0);
  });
});

describe("landingPositionFromFilename", () => {
  it.each([
    ["1.png", 1],
    ["2.jpg", 2],
    ["12-foo.png", 12],
  ])("parses %s → %i", (filename, position) => {
    expect(landingPositionFromFilename(filename)).toBe(position);
  });

  it("returns null when the filename has no numeric prefix", () => {
    expect(landingPositionFromFilename("foo.png")).toBeNull();
    expect(landingPositionFromFilename("0.png")).toBeNull();
  });
});

describe("resolveLandingImageSrc", () => {
  it("returns the local fallback when there is no media map", () => {
    expect(resolveLandingImageSrc("inicio", "1.png")).toBe(
      "/images/sections/inicio/1.png",
    );
  });

  it("returns the override URL when a row matches the position", () => {
    const map = buildLandingMediaMap(rows, publicUrl);
    expect(resolveLandingImageSrc("inicio", "1.png", map)).toBe(
      "https://cdn.example/storage/t1/inicio/1-foo.jpg",
    );
  });

  it("falls back when no row matches the position", () => {
    const map = buildLandingMediaMap(rows, publicUrl);
    expect(resolveLandingImageSrc("inicio", "3.png", map)).toBe(
      "/images/sections/inicio/3.png",
    );
  });
});
