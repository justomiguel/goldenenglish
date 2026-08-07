import { describe, it, expect } from "vitest";
import { badgeAchievementToneStyle } from "@/lib/badges/badgeAchievementTone";

describe("badgeAchievementToneStyle", () => {
  it("returns full color for earned badges", () => {
    expect(badgeAchievementToneStyle(false, 0)).toEqual({ filter: "none", opacity: 1 });
  });

  it("is mostly gray and faint at 0% progress", () => {
    expect(badgeAchievementToneStyle(true, 0)).toEqual({
      filter: "grayscale(1.000)",
      opacity: 0.35,
    });
  });

  it("is full color and opaque at 100% progress", () => {
    expect(badgeAchievementToneStyle(true, 100)).toEqual({
      filter: "grayscale(0.000)",
      opacity: 1,
    });
  });

  it("interpolates mid progress", () => {
    expect(badgeAchievementToneStyle(true, 50)).toEqual({
      filter: "grayscale(0.500)",
      opacity: 0.675,
    });
  });
});
