/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { planTrialConvertQuote } from "@/lib/register/planTrialConvertQuote";

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("planTrialConvertQuote", () => {
  it("drops sections without cupo unless the visitor still holds attended", () => {
    const quote = planTrialConvertQuote({
      selectedSectionIds: [A, B],
      seats: [
        { sectionId: A, status: "attended", hasOpenSeat: false },
        { sectionId: B, status: "absent", hasOpenSeat: false },
      ],
      enrollmentAmounts: { [A]: 0, [B]: 0 },
      monthlyAmounts: { [A]: 20000, [B]: 20000 },
      alreadyPaidEnrollmentIds: [],
      alreadyPaidMonthIds: [],
      currency: "CLP",
    });
    expect(quote.ok).toBe(true);
    if (!quote.ok) return;
    expect(quote.payableSectionIds).toEqual([A]);
    expect(quote.kind).toBe("first_month");
    expect(quote.total).toBe(20000);
  });

  it("uses enrollment when any payable section still charges matrícula", () => {
    const quote = planTrialConvertQuote({
      selectedSectionIds: [A],
      seats: [{ sectionId: A, status: "attended", hasOpenSeat: true }],
      enrollmentAmounts: { [A]: 80000 },
      monthlyAmounts: { [A]: 20000 },
      alreadyPaidEnrollmentIds: [],
      alreadyPaidMonthIds: [],
      currency: "CLP",
    });
    expect(quote).toMatchObject({
      ok: true,
      kind: "enrollment",
      total: 80000,
    });
  });

  it("skips enrollment and month lines the student already paid", () => {
    const quote = planTrialConvertQuote({
      selectedSectionIds: [A],
      seats: [{ sectionId: A, status: "attended", hasOpenSeat: true }],
      enrollmentAmounts: { [A]: 80000 },
      monthlyAmounts: { [A]: 20000 },
      alreadyPaidEnrollmentIds: [A],
      alreadyPaidMonthIds: [A],
      currency: "CLP",
    });
    expect(quote).toMatchObject({ ok: true, kind: "first_month", total: 0 });
  });
});
