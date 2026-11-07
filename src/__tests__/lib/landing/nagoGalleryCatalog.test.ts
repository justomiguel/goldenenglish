import { describe, expect, it } from "vitest";
import {
  NAGO_GALLERY_EVENT_IDS,
  filterNagoGalleryItems,
  nagoGalleryImagesFor,
  nagoGalleryItemsFor,
  nagoGalleryPreviewItems,
  nagoGalleryVideoPreviewItems,
  nagoGalleryVideosFor,
} from "@/lib/landing/nagoGalleryCatalog";

// REGRESSION CHECK: Gallery filters must keep event ids stable. A new event
// appends an id and files. It must not drop Conexión Internacional 2025.

describe("filterNagoGalleryItems", () => {
  const items = [
    { eventId: "a", src: "a1" },
    { eventId: "b", src: "b1" },
    { eventId: "a", src: "a2" },
  ];

  it("returns every item for all", () => {
    expect(filterNagoGalleryItems(items, "all")).toEqual(items);
  });

  it("returns one event and keeps source order", () => {
    expect(filterNagoGalleryItems(items, "a").map((item) => item.src)).toEqual(["a1", "a2"]);
  });
});

describe("NAGO_GALLERY_ITEMS", () => {
  it("ships both events and keeps Conexión Internacional 2025", () => {
    expect(NAGO_GALLERY_EVENT_IDS).toEqual([
      "conexion-internacional-2025",
      "capoeira-me-chama-2022",
    ]);
    const conexion = nagoGalleryImagesFor("conexion-internacional-2025");
    const chama = nagoGalleryImagesFor("capoeira-me-chama-2022");
    const clips = nagoGalleryVideosFor("capoeira-me-chama-2022");
    expect(conexion).toHaveLength(41);
    expect(chama).toHaveLength(52);
    expect(clips).toHaveLength(34);
    expect(nagoGalleryVideosFor("conexion-internacional-2025")).toHaveLength(0);
    expect(nagoGalleryItemsFor("all").filter((item) => item.kind === "image")).toHaveLength(93);
    expect(conexion[0]?.src).toBe(
      "/images/nago/galeria/conexion-internacional-2025/01.jpg",
    );
    expect(chama[0]?.src).toBe("/images/nago/galeria/capoeira-me-chama-2022/01.jpg");
    expect(chama[51]?.src).toBe("/images/nago/galeria/capoeira-me-chama-2022/52.jpg");
    expect(clips[0]?.src).toBe("/images/nago/galeria/capoeira-me-chama-2022/v01.mp4");
    expect(clips[0]?.poster).toBe("/images/nago/galeria/capoeira-me-chama-2022/v01.jpg");
    expect(nagoGalleryPreviewItems("conexion-internacional-2025")).toHaveLength(3);
    expect(nagoGalleryPreviewItems("capoeira-me-chama-2022")[0]?.src).toBe(
      "/images/nago/galeria/capoeira-me-chama-2022/01.jpg",
    );
    expect(nagoGalleryVideoPreviewItems("capoeira-me-chama-2022")).toHaveLength(3);
    expect(nagoGalleryVideoPreviewItems("capoeira-me-chama-2022")[2]?.src).toContain("v03.mp4");
  });
});
