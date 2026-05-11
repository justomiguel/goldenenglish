import { describe, expect, it } from "vitest";
import { composeFlowMonthlyOrderSubject } from "@/lib/billing/composeFlowMonthlyOrderSubject";

describe("composeFlowMonthlyOrderSubject", () => {
  it("fills section and period into template", () => {
    const s = composeFlowMonthlyOrderSubject({
      template: "{sectionName} — Tuition ({periodLabel})",
      sectionName: "Kids A",
      periodLabel: "May 2026",
    });
    expect(s).toContain("Kids A");
    expect(s).toContain("May 2026");
  });
});
