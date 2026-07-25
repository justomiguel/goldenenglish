/**
 * Subject: formatSectionFeePlanLabel (pure billing label helper).
 */
import { describe, expect, it } from "vitest";
import { formatSectionFeePlanLabel } from "@/lib/billing/formatSectionFeePlanLabel";

describe("formatSectionFeePlanLabel", () => {
  it("formats effective month/year and amount", () => {
    expect(
      formatSectionFeePlanLabel(
        {
          id: "p1",
          sectionId: "s1",
          effectiveFromYear: 2026,
          effectiveFromMonth: 1,
          monthlyFee: 100,
          currency: "CLP",
          archivedAt: null,
        },
        { effectiveFromShort: "From" },
      ),
    ).toBe("From 01/2026 · CLP 100.00");
  });
});
