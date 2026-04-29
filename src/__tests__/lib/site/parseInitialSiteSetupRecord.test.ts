import { describe, expect, it } from "vitest";
import { parseInitialSiteSetupCompletedAt } from "@/lib/site/parseInitialSiteSetupRecord";

describe("parseInitialSiteSetupCompletedAt", () => {
  it("returns null for empty completedAt", () => {
    expect(parseInitialSiteSetupCompletedAt({ completedAt: null })).toBeNull();
    expect(parseInitialSiteSetupCompletedAt({ completedAt: "" })).toBeNull();
    expect(parseInitialSiteSetupCompletedAt({})).toBeNull();
  });

  it("returns trimmed ISO string when present", () => {
    expect(parseInitialSiteSetupCompletedAt({ completedAt: " 2026-01-01T00:00:00.000Z " })).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });
});
