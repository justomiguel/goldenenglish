/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { planJoinPackageQuote } from "@/lib/register/planJoinPackageQuote";

const SEC = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const WED = { dayOfWeek: 3, startTime: "18:00", endTime: "19:00" };

function section(overrides: Partial<Parameters<typeof planJoinPackageQuote>[0]["sections"][0]> = {}) {
  return {
    id: SEC,
    name: "A2 Mañana",
    sectionAmount: 80000,
    cohortDefault: null,
    monthlyAmount: 40000,
    billingMode: "section_monthly_fee",
    slots: [WED],
    startsOn: "2026-03-01",
    endsOn: "2026-12-31",
    ...overrides,
  };
}

describe("planJoinPackageQuote", () => {
  it("sums matrícula and August when classes remain", () => {
    const snap = planJoinPackageQuote({
      mode: "per_section",
      currency: "CLP",
      nowIso: "2026-08-10T15:00:00.000Z",
      now: new Date("2026-08-10T15:00:00.000Z"),
      timeZone: "UTC",
      sections: [section()],
    });
    expect(snap.kind).toBe("join_package");
    expect(snap.total).toBe(120000);
    expect(snap.enrollment.lines[0]?.amount).toBe(80000);
    expect(snap.tuition).toEqual([
      { sectionId: SEC, sectionName: "A2 Mañana", year: 2026, month: 8, amount: 40000 },
    ]);
    expect(snap.lines[0]?.amount).toBe(80000);
  });

  it("charges September when August has no remaining class", () => {
    const snap = planJoinPackageQuote({
      mode: "per_section",
      currency: "CLP",
      nowIso: "2026-08-26T19:00:00.000Z",
      now: new Date("2026-08-26T19:00:00.000Z"),
      timeZone: "UTC",
      sections: [section()],
    });
    expect(snap.tuition[0]).toMatchObject({ year: 2026, month: 9, amount: 40000 });
    expect(snap.total).toBe(120000);
  });

  it("omits the month at the end of the cycle and for class-pack", () => {
    const ended = planJoinPackageQuote({
      mode: "per_section",
      currency: "CLP",
      nowIso: "2026-08-26T19:00:00.000Z",
      now: new Date("2026-08-26T19:00:00.000Z"),
      timeZone: "UTC",
      sections: [section({ endsOn: "2026-08-31" })],
    });
    expect(ended.tuition).toEqual([]);
    expect(ended.total).toBe(80000);

    const pack = planJoinPackageQuote({
      mode: "per_section",
      currency: "CLP",
      nowIso: "2026-08-10T15:00:00.000Z",
      now: new Date("2026-08-10T15:00:00.000Z"),
      timeZone: "UTC",
      sections: [section({ billingMode: "class_pack" })],
    });
    expect(pack.tuition).toEqual([]);
    expect(pack.total).toBe(80000);
  });

  it("subtracts unused trial credit and returns total 0 with no sections", () => {
    const credited = planJoinPackageQuote({
      mode: "per_section",
      currency: "CLP",
      nowIso: "2026-08-10T15:00:00.000Z",
      now: new Date("2026-08-10T15:00:00.000Z"),
      timeZone: "UTC",
      sections: [section()],
      trialPaid: 15000,
      trialAlreadyCredited: 0,
      creditEnabled: true,
    });
    expect(credited.trialCreditApplied).toBe(15000);
    expect(credited.total).toBe(105000);

    const empty = planJoinPackageQuote({
      mode: "once_for_all",
      currency: "CLP",
      nowIso: "2026-08-10T15:00:00.000Z",
      now: new Date("2026-08-10T15:00:00.000Z"),
      timeZone: "UTC",
      sections: [],
      sharedAmount: 80000,
    });
    expect(empty.total).toBe(0);
    expect(empty.tuition).toEqual([]);
    expect(empty.enrollment.lines).toEqual([]);
  });
});
