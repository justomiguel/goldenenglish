import { describe, expect, it } from "vitest";
import type { Dictionary } from "@/types/i18n";
import en from "@/dictionaries/en.json";
import {
  parseStudentGalleryPhotoIndexesList,
  resolveStudentGalleryAlbumSlides,
} from "@/lib/landing/studentGalleryAlbumSlides";

const baseSg = (en as Dictionary).landing.studentGallery;

describe("parseStudentGalleryPhotoIndexesList", () => {
  it("parses comma / space separated indices and drops invalid", () => {
    expect(parseStudentGalleryPhotoIndexesList("0, 2 ,99", 5, [1])).toEqual([
      0, 2,
    ]);
  });

  it("falls back when raw empty", () => {
    expect(parseStudentGalleryPhotoIndexesList("", 10, [3, 4])).toEqual([3, 4]);
    expect(parseStudentGalleryPhotoIndexesList(undefined, 10, [])).toEqual([0]);
  });
});

describe("resolveStudentGalleryAlbumSlides", () => {
  it("uses CMS strings for albums 1–2 when present", () => {
    const sg = {
      ...baseSg,
      album1PhotoIndexes: "0, 1, 2",
      album2PhotoIndexes: "4, 5",
      items: baseSg.items,
    };
    expect(resolveStudentGalleryAlbumSlides(sg, 0, 12)).toEqual([0, 1, 2]);
    expect(resolveStudentGalleryAlbumSlides(sg, 1, 12)).toEqual([4, 5]);
  });
});
