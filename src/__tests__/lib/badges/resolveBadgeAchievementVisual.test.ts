import { describe, it, expect } from "vitest";
import { Trophy } from "lucide-react";
import { BADGE_TASKS_10 } from "@/lib/badges/badgeCodes";
import { resolveBadgeAchievementVisual } from "@/lib/badges/resolveBadgeAchievementVisual";

describe("resolveBadgeAchievementVisual", () => {
  it("uses category defaults for unknown codes", () => {
    const visual = resolveBadgeAchievementVisual("learning", "custom_badge_code");
    expect(visual.shellClassName).toContain("accent");
    expect(visual.Icon).toBeDefined();
  });

  it("overrides icon for seed task milestone codes", () => {
    const visual = resolveBadgeAchievementVisual("tasks", BADGE_TASKS_10);
    expect(visual.Icon).toBe(Trophy);
  });
});
