import { describe, expect, it } from "vitest";
import { pickHomeSharePhotoUrl } from "@/lib/site/pickHomeSharePhotoUrl";

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

  it("uses the bundled home photo when the map is empty", () => {
    expect(
      pickHomeSharePhotoUrl({ media: null, bundledInicio: "/images/nago/inicio/1.png", bundledGallery: null }),
    ).toBe("/images/nago/inicio/1.png");
  });
});
