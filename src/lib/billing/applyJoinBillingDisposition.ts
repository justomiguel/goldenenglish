import type { JoinBillingDisposition } from "@/lib/billing/joinBillingDispositionSchema";
import { planJoinBillingMonths } from "@/lib/billing/planJoinBillingMonths";
import { isPeriodCoveredByScholarship } from "@/lib/billing/scholarshipPeriod";
import { sectionIsClassPackBilled } from "@/lib/billing/sectionBillingMode";

export type JoinSectionFacts = {
  sectionId: string;
  startsOn: string | null;
  endsOn: string | null;
  billingMode: string | null;
  enrollmentFeeAmount: number | null;
  enrollmentFeeExempt: boolean;
  lastEnrollmentPaidAt: string | null;
  enrollmentId: string | null;
};

export type JoinPaymentRow = { year: number; month: number; status: string };

export type JoinScholarshipCover = {
  discount_percent: number;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
};

export type JoinBillingDispositionPort = {
  loadSectionFacts: (
    studentId: string,
    sectionIds: string[],
  ) => Promise<JoinSectionFacts[]>;
  loadPayments: (studentId: string, sectionId: string) => Promise<JoinPaymentRow[]>;
  insertExempt: (input: {
    studentId: string;
    sectionId: string;
    year: number;
    month: number;
  }) => Promise<{ ok: boolean }>;
  recordApprovedJoinMonth: (input: {
    studentId: string;
    sectionId: string;
    year: number;
    month: number;
    actorId: string;
  }) => Promise<{ ok: boolean }>;
  loadScholarships: (studentId: string, sectionId: string) => Promise<JoinScholarshipCover[]>;
  insertScholarship: (input: {
    studentId: string;
    sectionId: string;
    enrollmentId: string;
    percent: number;
    validFromYear: number;
    validFromMonth: number;
    validUntilYear: number;
    validUntilMonth: number;
    actorId: string;
  }) => Promise<{ ok: boolean }>;
  stampEnrollmentPaid: (enrollmentId: string) => Promise<{ ok: boolean }>;
};

export type ApplyJoinBillingDispositionInput = {
  studentId: string;
  sectionIds: string[];
  disposition: JoinBillingDisposition;
  actorId: string;
  now?: Date;
};

function hasPayment(rows: JoinPaymentRow[], year: number, month: number): boolean {
  return rows.some((row) => row.year === year && row.month === month);
}

function isApproved(rows: JoinPaymentRow[], year: number, month: number): boolean {
  return rows.some(
    (row) => row.year === year && row.month === month && row.status === "approved",
  );
}

export async function applyJoinBillingDisposition(
  port: JoinBillingDispositionPort,
  input: ApplyJoinBillingDispositionInput,
): Promise<{ ok: true } | { ok: false; code: "seed_failed" }> {
  const now = input.now ?? new Date();
  const joinYear = now.getFullYear();
  const joinMonth = now.getMonth() + 1;
  const uniqueIds = [...new Set(input.sectionIds.filter(Boolean))];
  if (uniqueIds.length === 0) return { ok: true };
  const facts = await port.loadSectionFacts(input.studentId, uniqueIds);
  if (facts.length === 0) return { ok: false, code: "seed_failed" };
  for (const section of facts) {
    const seeded = await seedOneSection(port, input, section, joinYear, joinMonth);
    if (!seeded.ok) return seeded;
  }
  return { ok: true };
}

async function seedOneSection(
  port: JoinBillingDispositionPort,
  input: ApplyJoinBillingDispositionInput,
  section: JoinSectionFacts,
  joinYear: number,
  joinMonth: number,
): Promise<{ ok: true } | { ok: false; code: "seed_failed" }> {
  if (!sectionIsClassPackBilled(section.billingMode)) {
    const months = await seedMonthlyRows(port, input, section, joinYear, joinMonth);
    if (!months.ok) return months;
  }
  return stampMatriculaIfCurrent(port, input, section);
}

async function seedMonthlyRows(
  port: JoinBillingDispositionPort,
  input: ApplyJoinBillingDispositionInput,
  section: JoinSectionFacts,
  joinYear: number,
  joinMonth: number,
): Promise<{ ok: true } | { ok: false; code: "seed_failed" }> {
  const plan = planJoinBillingMonths({
    sectionStartsOn: section.startsOn,
    sectionEndsOn: section.endsOn,
    joinYear,
    joinMonth,
  });
  const payments = await port.loadPayments(input.studentId, section.sectionId);
  for (const prior of plan.priorMonths) {
    if (hasPayment(payments, prior.year, prior.month)) continue;
    const written = await port.insertExempt({
      studentId: input.studentId,
      sectionId: section.sectionId,
      year: prior.year,
      month: prior.month,
    });
    if (!written.ok) return { ok: false, code: "seed_failed" };
  }
  if (
    input.disposition.kind === "current" &&
    plan.joinIsBillable &&
    !isApproved(payments, joinYear, joinMonth)
  ) {
    const paid = await port.recordApprovedJoinMonth({
      studentId: input.studentId,
      sectionId: section.sectionId,
      year: joinYear,
      month: joinMonth,
      actorId: input.actorId,
    });
    if (!paid.ok) return { ok: false, code: "seed_failed" };
  }
  if (input.disposition.kind !== "scholarship" || !section.enrollmentId) return { ok: true };
  return seedScholarship(port, input, section, plan.lastCycleMonth, joinYear, joinMonth);
}

async function seedScholarship(
  port: JoinBillingDispositionPort,
  input: ApplyJoinBillingDispositionInput,
  section: JoinSectionFacts,
  lastCycleMonth: { year: number; month: number },
  joinYear: number,
  joinMonth: number,
): Promise<{ ok: true } | { ok: false; code: "seed_failed" }> {
  if (input.disposition.kind !== "scholarship" || !section.enrollmentId) return { ok: true };
  const existing = await port.loadScholarships(input.studentId, section.sectionId);
  const covered = existing.some((row) =>
    isPeriodCoveredByScholarship(joinYear, joinMonth, row),
  );
  if (covered) return { ok: true };
  const until =
    input.disposition.scope === "join_month"
      ? { year: joinYear, month: joinMonth }
      : lastCycleMonth;
  const written = await port.insertScholarship({
    studentId: input.studentId,
    sectionId: section.sectionId,
    enrollmentId: section.enrollmentId,
    percent: input.disposition.percent,
    validFromYear: joinYear,
    validFromMonth: joinMonth,
    validUntilYear: until.year,
    validUntilMonth: until.month,
    actorId: input.actorId,
  });
  return written.ok ? { ok: true } : { ok: false, code: "seed_failed" };
}

async function stampMatriculaIfCurrent(
  port: JoinBillingDispositionPort,
  input: ApplyJoinBillingDispositionInput,
  section: JoinSectionFacts,
): Promise<{ ok: true } | { ok: false; code: "seed_failed" }> {
  if (input.disposition.kind !== "current" || !section.enrollmentId) return { ok: true };
  const feeDue =
    (section.enrollmentFeeAmount ?? 0) > 0 &&
    !section.enrollmentFeeExempt &&
    !section.lastEnrollmentPaidAt;
  if (!feeDue) return { ok: true };
  const stamped = await port.stampEnrollmentPaid(section.enrollmentId);
  return stamped.ok ? { ok: true } : { ok: false, code: "seed_failed" };
}
