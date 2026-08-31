import { applyPaidTrialCredit } from "@/lib/billing/applyPaidTrialCredit";

export type TrialConvertSeat = {
  sectionId: string;
  status: "booked" | "attended" | "absent" | "released";
  hasOpenSeat: boolean;
};

export type TrialConvertQuoteKind = "enrollment" | "first_month" | "enrollment_and_month";

export type TrialConvertQuote =
  | { ok: false; code: "no_section" }
  | {
      ok: true;
      kind: TrialConvertQuoteKind;
      payableSectionIds: string[];
      droppedSectionIds: string[];
      enrollmentDue: number;
      monthDue: number;
      trialCreditApplied: number;
      total: number;
      currency: string;
    };

function isPayable(seat: TrialConvertSeat): boolean {
  return seat.hasOpenSeat || seat.status === "attended";
}

function quoteKind(enrollmentDue: number, monthDue: number): TrialConvertQuoteKind {
  if (enrollmentDue > 0 && monthDue > 0) return "enrollment_and_month";
  if (enrollmentDue > 0) return "enrollment";
  return "first_month";
}

export function planTrialConvertQuote(input: {
  selectedSectionIds: string[];
  seats: TrialConvertSeat[];
  enrollmentAmounts: Record<string, number>;
  monthlyAmounts: Record<string, number>;
  alreadyPaidEnrollmentIds: string[];
  alreadyPaidMonthIds: string[];
  currency: string;
  trialPaid?: number;
  trialAlreadyCredited?: number;
  creditEnabled?: boolean;
}): TrialConvertQuote {
  const selected = [...new Set(input.selectedSectionIds.filter(Boolean))];
  if (selected.length === 0) return { ok: false, code: "no_section" };
  const byId = new Map(input.seats.map((seat) => [seat.sectionId, seat]));
  const paidEnroll = new Set(input.alreadyPaidEnrollmentIds);
  const paidMonth = new Set(input.alreadyPaidMonthIds);
  const payableSectionIds: string[] = [];
  const droppedSectionIds: string[] = [];
  for (const id of selected) {
    const seat = byId.get(id);
    if (!seat || !isPayable(seat)) {
      droppedSectionIds.push(id);
      continue;
    }
    payableSectionIds.push(id);
  }
  if (payableSectionIds.length === 0) return { ok: false, code: "no_section" };

  const enrollmentDue = payableSectionIds.reduce((sum, id) => {
    if (paidEnroll.has(id)) return sum;
    return sum + Math.max(0, Number(input.enrollmentAmounts[id] ?? 0) || 0);
  }, 0);
  const monthDue = payableSectionIds.reduce((sum, id) => {
    if (paidMonth.has(id)) return sum;
    return sum + Math.max(0, Number(input.monthlyAmounts[id] ?? 0) || 0);
  }, 0);
  const credited = applyPaidTrialCredit({
    enrollmentDue,
    tuitionDue: monthDue,
    trialPaid: input.trialPaid ?? 0,
    alreadyCredited: input.trialAlreadyCredited ?? 0,
    enabled: input.creditEnabled === true,
  });
  return {
    ok: true,
    kind: quoteKind(credited.enrollmentDue, credited.tuitionDue),
    payableSectionIds,
    droppedSectionIds,
    enrollmentDue: credited.enrollmentDue,
    monthDue: credited.tuitionDue,
    trialCreditApplied: credited.creditApplied,
    total: credited.total,
    currency: input.currency,
  };
}
