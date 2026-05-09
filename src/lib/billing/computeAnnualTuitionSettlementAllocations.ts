export type BillableSettlementMonth = { year: number; month: number; listAmount: number };

export type AnnualTuitionAllocationResult =
  | {
      ok: true;
      baselineListTotal: number;
      impliedDiscountAmount: number;
      /** Monthly payment amounts (sum = tuition pool). */
      months: Array<{ year: number; month: number; amount: number }>;
      /** Portion of accepted total attributed to enrollment fee when included. */
      enrollmentFeePortion: number;
      tuitionPool: number;
    }
  | {
      ok: false;
      code:
        | "no_billable_months"
        | "tuition_pool_negative"
        | "accepted_below_enrollment_fee"
        | "accepted_exceeds_baseline";
    };

const MONEY_EPS = 0.005;

/**
 * `accepted_total` covers list tuition months (proportional split) plus optional
 * full list enrollment fee when `includesEnrollmentFee` and `enrollmentFeeList > 0`.
 */
export function computeAnnualTuitionSettlementAllocations(input: {
  billableMonths: readonly BillableSettlementMonth[];
  enrollmentFeeList: number;
  includesEnrollmentFee: boolean;
  acceptedTotal: number;
}): AnnualTuitionAllocationResult {
  const fee = input.includesEnrollmentFee ? Math.max(0, input.enrollmentFeeList) : 0;
  const listTuitionSum = input.billableMonths.reduce((s, m) => s + m.listAmount, 0);
  if (listTuitionSum <= 0 && fee <= 0) {
    return { ok: false, code: "no_billable_months" };
  }
  if (input.billableMonths.length === 0 && fee <= 0) {
    return { ok: false, code: "no_billable_months" };
  }

  const baselineListTotal = listTuitionSum + fee;
  if (input.acceptedTotal - baselineListTotal > MONEY_EPS) {
    return { ok: false, code: "accepted_exceeds_baseline" };
  }

  if (fee > 0 && input.acceptedTotal + MONEY_EPS < fee) {
    return { ok: false, code: "accepted_below_enrollment_fee" };
  }

  const tuitionPool = input.acceptedTotal - fee;
  if (tuitionPool < -MONEY_EPS) {
    return { ok: false, code: "tuition_pool_negative" };
  }

  if (input.billableMonths.length === 0) {
    const impliedDiscountAmount = Math.round((baselineListTotal - input.acceptedTotal) * 100) / 100;
    return {
      ok: true,
      baselineListTotal,
      impliedDiscountAmount,
      months: [],
      enrollmentFeePortion: fee,
      tuitionPool: 0,
    };
  }

  if (tuitionPool < MONEY_EPS && listTuitionSum > MONEY_EPS) {
    return { ok: false, code: "tuition_pool_negative" };
  }

  const weights = input.billableMonths.map((m) => m.listAmount);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  let months: Array<{ year: number; month: number; amount: number }> = [];

  if (weightSum <= MONEY_EPS) {
    const each = Math.round((tuitionPool / input.billableMonths.length) * 100) / 100;
    months = input.billableMonths.map((m, i) => ({
      year: m.year,
      month: m.month,
      amount: i === input.billableMonths.length - 1
        ? Math.round((tuitionPool - each * (input.billableMonths.length - 1)) * 100) / 100
        : each,
    }));
  } else {
    const raw = weights.map((w) => (tuitionPool * w) / weightSum);
    const floors = raw.map((x) => Math.floor(x * 100) / 100);
    const allocated = floors.reduce((a, b) => a + b, 0);
    let remainderCents = Math.round((tuitionPool - allocated) * 100);
    const order = floors
      .map((f, i) => ({ i, frac: raw[i] * 100 - Math.floor(raw[i] * 100) }))
      .sort((a, b) => b.frac - a.frac);
    let c = 0;
    const adjusted = [...floors];
    while (remainderCents > 0 && c < order.length) {
      const idx = order[c % order.length].i;
      adjusted[idx] = Math.round((adjusted[idx] + 0.01) * 100) / 100;
      remainderCents -= 1;
      c += 1;
    }
    months = input.billableMonths.map((m, i) => ({
      year: m.year,
      month: m.month,
      amount: adjusted[i] ?? 0,
    }));
  }

  const impliedDiscountAmount = Math.round((baselineListTotal - input.acceptedTotal) * 100) / 100;
  return {
    ok: true,
    baselineListTotal,
    impliedDiscountAmount,
    months,
    enrollmentFeePortion: fee,
    tuitionPool,
  };
}
