import { periodIndex } from "@/lib/billing/scholarshipPeriod";

export type JoinBillingYearMonth = { year: number; month: number };

export type PlanJoinBillingMonthsInput = {
  sectionStartsOn: string | null;
  sectionEndsOn: string | null;
  joinYear: number;
  joinMonth: number;
};

export type PlanJoinBillingMonthsResult = {
  priorMonths: JoinBillingYearMonth[];
  lastCycleMonth: JoinBillingYearMonth;
  joinIsBillable: boolean;
};

function yearMonthFromIsoDate(iso: string | null): JoinBillingYearMonth | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  return { year, month };
}

function nextMonth(ym: JoinBillingYearMonth): JoinBillingYearMonth {
  return ym.month === 12 ? { year: ym.year + 1, month: 1 } : { year: ym.year, month: ym.month + 1 };
}

export function firstAvailableCycleMonth(input: {
  startsOn: string | null;
  endsOn: string | null;
  now: Date;
}): JoinBillingYearMonth {
  const nowMonth = { year: input.now.getFullYear(), month: input.now.getMonth() + 1 };
  const start = yearMonthFromIsoDate(input.startsOn);
  const end = yearMonthFromIsoDate(input.endsOn);
  if (!start) return nowMonth;
  if (periodIndex(nowMonth.year, nowMonth.month) < periodIndex(start.year, start.month)) return start;
  if (end && periodIndex(nowMonth.year, nowMonth.month) > periodIndex(end.year, end.month)) return end;
  return nowMonth;
}

export function planJoinBillingMonths(
  input: PlanJoinBillingMonthsInput,
): PlanJoinBillingMonthsResult {
  const join = { year: input.joinYear, month: input.joinMonth };
  const start = yearMonthFromIsoDate(input.sectionStartsOn) ?? join;
  const end = yearMonthFromIsoDate(input.sectionEndsOn) ?? { year: join.year, month: 12 };
  const joinIdx = periodIndex(join.year, join.month);
  const startIdx = periodIndex(start.year, start.month);
  const endIdx = periodIndex(end.year, end.month);
  const joinIsBillable = joinIdx >= startIdx && joinIdx <= endIdx;
  const priorMonths: JoinBillingYearMonth[] = [];
  if (startIdx < joinIdx) {
    let cursor = start;
    while (periodIndex(cursor.year, cursor.month) < joinIdx) {
      priorMonths.push(cursor);
      cursor = nextMonth(cursor);
    }
  }
  return { priorMonths, lastCycleMonth: end, joinIsBillable };
}
