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

  it("adds matrícula and join-month tuition when both are due", () => {
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
      kind: "enrollment_and_month",
      enrollmentDue: 80000,
      monthDue: 20000,
      total: 100000,
    });
  });

  it("keeps first_month when matrícula is already paid", () => {
    const quote = planTrialConvertQuote({
      selectedSectionIds: [A],
      seats: [{ sectionId: A, status: "attended", hasOpenSeat: true }],
      enrollmentAmounts: { [A]: 80000 },
      monthlyAmounts: { [A]: 20000 },
      alreadyPaidEnrollmentIds: [A],
      alreadyPaidMonthIds: [],
      currency: "CLP",
    });
    expect(quote).toMatchObject({
      ok: true,
      kind: "first_month",
      enrollmentDue: 0,
      monthDue: 20000,
      total: 20000,
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
    expect(quote).toMatchObject({
      ok: true,
      kind: "first_month",
      enrollmentDue: 0,
      monthDue: 0,
      total: 0,
    });
  });
});
