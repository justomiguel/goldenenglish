/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  formatJoinPackageBreakdown,
  joinPackagePayCtaKind,
} from "@/lib/register/formatJoinPackageCopy";

describe("formatJoinPackageCopy", () => {
  it("lists matrícula and the join month", () => {
    expect(
      formatJoinPackageBreakdown(
        {
          kind: "join_package",
          enrollment: { lines: [{ sectionId: "s1", sectionName: "A2", amount: 80 }] },
          tuition: [{ sectionId: "s1", sectionName: "A2", year: 2026, month: 8, amount: 40 }],
          trialCreditApplied: 0,
        },
        "es",
        { enrollment: "Matrícula" },
      ),
    ).toBe("Matrícula + agosto");
  });

  it("picks the pay CTA from which lines are due", () => {
    expect(
      joinPackagePayCtaKind({
        enrollment: { lines: [{ sectionId: "s1", sectionName: "A2", amount: 80 }] },
        tuition: [{ sectionId: "s1", sectionName: "A2", year: 2026, month: 8, amount: 40 }],
      }),
    ).toBe("both");
    expect(
      joinPackagePayCtaKind({
        enrollment: { lines: [{ sectionId: "s1", sectionName: "A2", amount: 0 }] },
        tuition: [{ sectionId: "s1", sectionName: "A2", year: 2026, month: 9, amount: 40 }],
      }),
    ).toBe("month");
    expect(
      joinPackagePayCtaKind({
        enrollment: { lines: [{ sectionId: "s1", sectionName: "A2", amount: 80 }] },
        tuition: [],
      }),
    ).toBe("enrollment");
  });
});
