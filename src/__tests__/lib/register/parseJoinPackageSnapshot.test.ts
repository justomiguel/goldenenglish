/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { parseJoinPackageSnapshot } from "@/lib/register/parseJoinPackageSnapshot";

describe("parseJoinPackageSnapshot", () => {
  it("reads a join_package snapshot", () => {
    const parsed = parseJoinPackageSnapshot({
      kind: "join_package",
      mode: "per_section",
      currency: "CLP",
      total: 105000,
      lines: [{ sectionId: "s1", sectionName: "A2", amount: 80000 }],
      capturedAt: "2026-08-10T00:00:00.000Z",
      enrollment: { lines: [{ sectionId: "s1", sectionName: "A2", amount: 80000 }] },
      tuition: [{ sectionId: "s1", sectionName: "A2", year: 2026, month: 8, amount: 40000 }],
      trialCreditApplied: 15000,
    });
    expect(parsed.kind).toBe("join_package");
    expect(parsed.total).toBe(105000);
    expect(parsed.tuition).toHaveLength(1);
    expect(parsed.trialCreditApplied).toBe(15000);
    expect(parsed.joinMonths).toEqual({ s1: { year: 2026, month: 8 } });
  });

  it("treats a legacy matrícula-only snapshot as enrollment without tuition", () => {
    const parsed = parseJoinPackageSnapshot({
      mode: "per_section",
      currency: "CLP",
      total: 80,
      lines: [{ sectionId: "s1", sectionName: "A2", amount: 80 }],
      capturedAt: "2026-08-01T00:00:00.000Z",
    });
    expect(parsed.kind).toBe("legacy");
    expect(parsed.enrollment.lines[0]?.amount).toBe(80);
    expect(parsed.tuition).toEqual([]);
    expect(parsed.joinMonths).toEqual({});
    expect(parsed.total).toBe(80);
  });
});
