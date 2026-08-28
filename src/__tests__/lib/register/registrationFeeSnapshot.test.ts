/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  buildRegistrationFeeSnapshot,
  canCohortUseOnceForAll,
} from "@/lib/register/registrationFeeSnapshot";

const NOW = "2026-08-28T18:00:00.000Z";

function sec(
  id: string,
  name: string,
  sectionAmount: number | null,
  cohortDefault: number | null = null,
) {
  return { id, name, sectionAmount, cohortDefault };
}

describe("canCohortUseOnceForAll", () => {
  it("is true when every effective amount is the same", () => {
    expect(canCohortUseOnceForAll([80, 80, 80])).toBe(true);
    expect(canCohortUseOnceForAll([0])).toBe(true);
    expect(canCohortUseOnceForAll([])).toBe(true);
  });

  it("is false when any two amounts differ", () => {
    expect(canCohortUseOnceForAll([80, 50])).toBe(false);
    expect(canCohortUseOnceForAll([0, 80])).toBe(false);
  });
});

describe("buildRegistrationFeeSnapshot", () => {
  it("sums per_section effective amounts", () => {
    const snap = buildRegistrationFeeSnapshot({
      mode: "per_section",
      currency: "CLP",
      nowIso: NOW,
      sections: [sec("a", "A1", 80), sec("b", "A2", 50)],
    });
    expect(snap.total).toBe(130);
    expect(snap.currency).toBe("CLP");
    expect(snap.mode).toBe("per_section");
    expect(snap.capturedAt).toBe(NOW);
    expect(snap.lines).toEqual([
      { sectionId: "a", sectionName: "A1", amount: 80 },
      { sectionId: "b", sectionName: "A2", amount: 50 },
    ]);
  });

  it("charges once_for_all only on the first line", () => {
    const snap = buildRegistrationFeeSnapshot({
      mode: "once_for_all",
      currency: "CLP",
      nowIso: NOW,
      sections: [sec("a", "A1", 80), sec("b", "A2", 80)],
    });
    expect(snap.total).toBe(80);
    expect(snap.lines).toEqual([
      { sectionId: "a", sectionName: "A1", amount: 80 },
      { sectionId: "b", sectionName: "A2", amount: 0 },
    ]);
  });

  it("inherits a cohort default when the section amount is null", () => {
    const snap = buildRegistrationFeeSnapshot({
      mode: "per_section",
      currency: "USD",
      nowIso: NOW,
      sections: [sec("a", "A1", null, 200)],
    });
    expect(snap.total).toBe(200);
    expect(snap.lines[0]?.amount).toBe(200);
  });

  it("omits already-covered sections in per_section mode", () => {
    const snap = buildRegistrationFeeSnapshot({
      mode: "per_section",
      currency: "CLP",
      nowIso: NOW,
      sections: [sec("a", "A1", 80), sec("b", "A2", 50)],
      alreadyCoveredSectionIds: ["a"],
    });
    expect(snap.total).toBe(50);
    expect(snap.lines).toEqual([{ sectionId: "b", sectionName: "A2", amount: 50 }]);
  });

  it("zeros once_for_all when the student already paid in the cohort", () => {
    const snap = buildRegistrationFeeSnapshot({
      mode: "once_for_all",
      currency: "CLP",
      nowIso: NOW,
      sections: [sec("a", "A1", 80)],
      onceForAllAlreadyCovered: true,
    });
    expect(snap.total).toBe(0);
    expect(snap.lines).toEqual([{ sectionId: "a", sectionName: "A1", amount: 0 }]);
  });

  it("uses sharedAmount when there are no sections in once_for_all", () => {
    const snap = buildRegistrationFeeSnapshot({
      mode: "once_for_all",
      currency: "CLP",
      nowIso: NOW,
      sections: [],
      sharedAmount: 80,
    });
    expect(snap.total).toBe(80);
    expect(snap.lines).toEqual([]);
    expect(snap.currency).toBe("CLP");
  });

  it("returns total 0 for undecided + per_section", () => {
    const snap = buildRegistrationFeeSnapshot({
      mode: "per_section",
      currency: "CLP",
      nowIso: NOW,
      sections: [],
    });
    expect(snap.total).toBe(0);
    expect(snap.lines).toEqual([]);
  });

  it("falls back to USD when no line has a positive amount and no currency is given", () => {
    const snap = buildRegistrationFeeSnapshot({
      mode: "per_section",
      nowIso: NOW,
      sections: [sec("a", "A1", 0)],
    });
    expect(snap.currency).toBe("USD");
    expect(snap.total).toBe(0);
  });
});
