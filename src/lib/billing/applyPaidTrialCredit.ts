/**
 * Applies a captured trial-class payment as credit against the first
 * enrollment + tuition invoice (monthly fee or equivalent pack charge).
 * Enrollment is reduced first, then tuition. Never goes below zero.
 */
export function applyPaidTrialCredit(input: {
  enrollmentDue: number;
  tuitionDue: number;
  trialPaid: number;
  alreadyCredited: number;
  enabled: boolean;
}): {
  enrollmentDue: number;
  tuitionDue: number;
  creditApplied: number;
  remainingCredit: number;
  total: number;
} {
  const enrollmentDue = Math.max(0, Number(input.enrollmentDue) || 0);
  const tuitionDue = Math.max(0, Number(input.tuitionDue) || 0);
  const trialPaid = Math.max(0, Number(input.trialPaid) || 0);
  const alreadyCredited = Math.max(0, Number(input.alreadyCredited) || 0);
  const available = Math.max(0, trialPaid - alreadyCredited);

  if (!input.enabled || available <= 0) {
    return {
      enrollmentDue,
      tuitionDue,
      creditApplied: 0,
      remainingCredit: available,
      total: enrollmentDue + tuitionDue,
    };
  }

  const onEnrollment = Math.min(available, enrollmentDue);
  const onTuition = Math.min(available - onEnrollment, tuitionDue);
  const creditApplied = onEnrollment + onTuition;
  return {
    enrollmentDue: enrollmentDue - onEnrollment,
    tuitionDue: tuitionDue - onTuition,
    creditApplied,
    remainingCredit: available - creditApplied,
    total: enrollmentDue - onEnrollment + tuitionDue - onTuition,
  };
}
