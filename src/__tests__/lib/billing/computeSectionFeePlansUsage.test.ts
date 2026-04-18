import { describe, expect, it } from "vitest";
import {
  attachSectionFeePlansUsage,
  computeSectionFeePlansInUseIds,
} from "@/lib/billing/computeSectionFeePlansUsage";
import type { SectionFeePlan } from "@/types/sectionFeePlan";

const planA: SectionFeePlan = {
  id: "A",
  sectionId: "sec",
  effectiveFromYear: 2026,
  effectiveFromMonth: 1,
  monthlyFee: 100,
  currency: "USD",
  archivedAt: null,
};

const planB: SectionFeePlan = {
  id: "B",
  sectionId: "sec",
  effectiveFromYear: 2026,
  effectiveFromMonth: 6,
  monthlyFee: 120,
  currency: "USD",
  archivedAt: null,
};

// REGRESSION CHECK: la atribución de pagos a planes determina qué plan puede
// borrarse en duro vs cuál debe archivarse. Si rompemos esto, podemos perder
// historial al permitir delete de un plan con cobros asociados.
describe("computeSectionFeePlansInUseIds", () => {
  it("returns empty when there are no plans or no payments", () => {
    expect(computeSectionFeePlansInUseIds([], [{ year: 2026, month: 1 }]).size).toBe(0);
    expect(computeSectionFeePlansInUseIds([planA], []).size).toBe(0);
  });

  it("attributes a payment to the most recent plan whose effective_from <= payment", () => {
    const ids = computeSectionFeePlansInUseIds([planA, planB], [{ year: 2026, month: 5 }]);
    expect([...ids]).toEqual(["A"]);
  });

  it("ignores payments before any plan's effective_from", () => {
    const ids = computeSectionFeePlansInUseIds([planA], [{ year: 2025, month: 12 }]);
    expect(ids.size).toBe(0);
  });

  it("aggregates multiple payments across plans", () => {
    const ids = computeSectionFeePlansInUseIds(
      [planA, planB],
      [
        { year: 2026, month: 2 },
        { year: 2026, month: 7 },
      ],
    );
    expect([...ids].sort()).toEqual(["A", "B"]);
  });
});

describe("attachSectionFeePlansUsage", () => {
  it("flags inUse plans without losing other fields", () => {
    const enriched = attachSectionFeePlansUsage(
      [planA, planB],
      [{ year: 2026, month: 7 }],
    );
    expect(enriched.find((p) => p.id === "A")?.inUse).toBe(false);
    expect(enriched.find((p) => p.id === "B")?.inUse).toBe(true);
  });
});
