import { describe, it, expect } from "vitest";
import { isThemeEligibleForInitialSiteSetup } from "@/lib/site/wizardThemeEligibility";

describe("isThemeEligibleForInitialSiteSetup", () => {
  it("rejects null or archived", () => {
    expect(isThemeEligibleForInitialSiteSetup(null, "mozarthitos")).toBe(false);
    expect(
      isThemeEligibleForInitialSiteSetup(
        {
          is_active: true,
          slug: "mozarthitos",
          archived_at: "2026-01-01",
        },
        "mozarthitos",
      ),
    ).toBe(false);
  });

  it("without brand slug: only active themes", () => {
    expect(
      isThemeEligibleForInitialSiteSetup(
        {
          is_active: true,
          slug: "default",
          archived_at: null,
        },
        null,
      ),
    ).toBe(true);
    expect(
      isThemeEligibleForInitialSiteSetup(
        {
          is_active: false,
          slug: "mozarthitos",
          archived_at: null,
        },
        null,
      ),
    ).toBe(false);
  });

  it("with brand slug: theme slug must match (active or not)", () => {
    expect(
      isThemeEligibleForInitialSiteSetup(
        {
          is_active: false,
          slug: "mozarthitos",
          archived_at: null,
        },
        "mozarthitos",
      ),
    ).toBe(true);
    expect(
      isThemeEligibleForInitialSiteSetup(
        {
          is_active: true,
          slug: "default",
          archived_at: null,
        },
        "mozarthitos",
      ),
    ).toBe(false);
  });
});
