import { describe, expect, it } from "vitest";
import { parseAdminWeeklyDigest } from "@/lib/admin-digest/parseAdminWeeklyDigest";
import { digestFixture } from "@/__tests__/lib/admin-digest/digestFixture";

describe("parseAdminWeeklyDigest", () => {
  it("accepts a complete payload", () => {
    const parsed = parseAdminWeeklyDigest(digestFixture());
    expect(parsed?.pendingReceipts).toBe(4);
    expect(parsed?.parentPercent).toBe(62);
  });

  it("rejects a payload that is missing a required count", () => {
    const raw = digestFixture();
    delete (raw as { pendingReceipts?: number }).pendingReceipts;
    expect(parseAdminWeeklyDigest(raw)).toBeNull();
  });
});
