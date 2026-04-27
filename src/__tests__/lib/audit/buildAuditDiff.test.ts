import { describe, expect, it } from "vitest";
import { buildAuditDiff } from "@/lib/audit/buildAuditDiff";

describe("buildAuditDiff", () => {
  it("returns changed top-level fields only", () => {
    const diff = buildAuditDiff(
      { status: "pending", amount: 100, meta: { a: 1 } },
      { status: "approved", amount: 100, meta: { a: 1 }, note: "ok" },
    );

    expect(diff).toEqual({
      status: { before: "pending", after: "approved" },
      note: { before: null, after: "ok" },
    });
  });
});
