/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { formatJoinBillingPreview } from "@/lib/billing/formatJoinBillingPreview";

describe("formatJoinBillingPreview", () => {
  it("summarizes prior months as exempt and the join month from the disposition", () => {
    const text = formatJoinBillingPreview({
      locale: "es",
      priorMonths: [
        { year: 2026, month: 1 },
        { year: 2026, month: 9 },
      ],
      joinMonth: { year: 2026, month: 10 },
      joinIsBillable: true,
      dispositionKind: "current",
      labels: {
        exempt: "exento",
        paid: "pagado",
        due: "adeudado",
        scholarship: "beca",
        nonePrior: "Sin meses anteriores",
      },
    });
    expect(text).toBe("Ene–Sep: exento · Oct: pagado");
  });

  it("omits the prior range when there are no prior months", () => {
    const text = formatJoinBillingPreview({
      locale: "es",
      priorMonths: [],
      joinMonth: { year: 2026, month: 1 },
      joinIsBillable: true,
      dispositionKind: "behind",
      labels: {
        exempt: "exento",
        paid: "pagado",
        due: "adeudado",
        scholarship: "beca",
        nonePrior: "Sin meses anteriores",
      },
    });
    expect(text).toBe("Ene: adeudado");
  });
});
