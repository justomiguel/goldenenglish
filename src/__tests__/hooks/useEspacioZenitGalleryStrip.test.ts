import { describe, expect, it } from "vitest";
import {
  LOOP_COPIES,
  buildLoopedGallerySlides,
  logicalIndexFromTrackOffset,
  middleTrackOffset,
  snapTrackOffsetAfterTransition,
} from "@/lib/landing/buildLoopedGallerySlides";

describe("buildLoopedGallerySlides", () => {
  it("returns one slide per image when total <= 1", () => {
    expect(buildLoopedGallerySlides(["/a.jpg"])).toEqual([
      { src: "/a.jpg", key: "/a.jpg-0", logicalIndex: 0 },
    ]);
  });

  it("builds five copies for seamless looping", () => {
    const slides = buildLoopedGallerySlides(["/a.jpg", "/b.jpg", "/c.jpg"]);
    expect(slides).toHaveLength(3 * LOOP_COPIES);
    expect(slides[6]).toMatchObject({ src: "/a.jpg", logicalIndex: 0 });
  });
});

describe("gallery strip offset helpers", () => {
  const total = 3;

  it("maps track offset to logical index", () => {
    expect(logicalIndexFromTrackOffset(6, total)).toBe(0);
    expect(logicalIndexFromTrackOffset(8, total)).toBe(2);
  });

  it("places the active slide in the middle copy band", () => {
    expect(middleTrackOffset(2, total)).toBe(8);
  });

  it("does not snap when advancing from last to first in one step", () => {
    const lastInHome = middleTrackOffset(total - 1, total);
    const firstAfterLast = lastInHome + 1;
    expect(snapTrackOffsetAfterTransition(firstAfterLast, total)).toBeNull();
  });

  it("snaps only after leaving the safe buffer band forward", () => {
    const maxSafe = 11;
    expect(snapTrackOffsetAfterTransition(maxSafe + 1, total)).toBe(maxSafe + 1 - total);
  });

  it("snaps backward after leaving the safe buffer band", () => {
    const minSafe = middleTrackOffset(0, total);
    expect(snapTrackOffsetAfterTransition(minSafe - 1, total)).toBe(minSafe - 1 + total);
  });
});
