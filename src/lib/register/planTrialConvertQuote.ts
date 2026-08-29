export type TrialConvertSeat = {
  sectionId: string;
  status: "booked" | "attended" | "absent" | "released";
  hasOpenSeat: boolean;
};

export type TrialConvertQuote =
  | { ok: false; code: "no_section" }
  | {
      ok: true;
      kind: "enrollment" | "first_month";
      payableSectionIds: string[];
      droppedSectionIds: string[];
      total: number;
      currency: string;
    };

function isPayable(seat: TrialConvertSeat): boolean {
  return seat.hasOpenSeat || seat.status === "attended";
}

export function planTrialConvertQuote(input: {
  selectedSectionIds: string[];
  seats: TrialConvertSeat[];
  enrollmentAmounts: Record<string, number>;
  monthlyAmounts: Record<string, number>;
  alreadyPaidEnrollmentIds: string[];
  alreadyPaidMonthIds: string[];
  currency: string;
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
  if (enrollmentDue > 0) {
    return {
      ok: true,
      kind: "enrollment",
      payableSectionIds,
      droppedSectionIds,
      total: enrollmentDue,
      currency: input.currency,
    };
  }
  const monthDue = payableSectionIds.reduce((sum, id) => {
    if (paidMonth.has(id)) return sum;
    return sum + Math.max(0, Number(input.monthlyAmounts[id] ?? 0) || 0);
  }, 0);
  return {
    ok: true,
    kind: "first_month",
    payableSectionIds,
    droppedSectionIds,
    total: monthDue,
    currency: input.currency,
  };
}
