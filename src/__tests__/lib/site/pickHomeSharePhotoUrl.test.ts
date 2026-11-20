import { describe, expect, it } from "vitest";
import {
  bundledDedicatedSharePath,
  pickHomeSharePhotoUrl,
} from "@/lib/site/pickHomeSharePhotoUrl";

describe("pickHomeSharePhotoUrl", () => {
  it("prefers the lowest inicio image", () => {
    const media = new Map([
      ["inicio::2", "/inicio-2.jpg"],
      ["inicio::1", "/inicio-1.jpg"],
      ["modalidades::1", "/gallery.jpg"],
    ]);
    expect(
      pickHomeSharePhotoUrl({ media, bundledInicio: "/bundled.png", bundledGallery: null }),
    ).toBe("/inicio-1.jpg");
  });

  it("uses the gallery when inicio is missing", () => {
    const media = new Map([["modalidades::3", "/gallery.jpg"]]);
    expect(pickHomeSharePhotoUrl({ media, bundledInicio: null, bundledGallery: null })).toBe(
      "/gallery.jpg",
    );
  });

  it("uses a dedicated share file ahead of the inicio slot", () => {
    const media = new Map([["inicio::1", "/images/mozarthitos/inicio/1.png"]]);
    expect(
      pickHomeSharePhotoUrl({
        media,
        bundledInicio: "/images/mozarthitos/inicio/1.png",
        bundledGallery: null,
        dedicatedShare: "/images/mozarthitos/og.jpg",
      }),
    ).toBe("/images/mozarthitos/og.jpg");
  });

  it("keeps the inicio slot when the dedicated path is the same file", () => {
    expect(
      bundledDedicatedSharePath(
        "/images/matiss/ilustraciones/og.jpg",
        "/images/matiss/ilustraciones/og.jpg",
      ),
    ).toBeNull();
    expect(bundledDedicatedSharePath("  ", "/inicio/1.png")).toBeNull();
    expect(
      bundledDedicatedSharePath("/images/mozarthitos/og.jpg", "/images/mozarthitos/inicio/1.png"),
    ).toBe("/images/mozarthitos/og.jpg");
  });

  it("uses the bundled home photo when the map is empty", () => {
    expect(
      pickHomeSharePhotoUrl({ media: null, bundledInicio: "/images/nago/inicio/1.png", bundledGallery: null }),
    ).toBe("/images/nago/inicio/1.png");
  });
});
