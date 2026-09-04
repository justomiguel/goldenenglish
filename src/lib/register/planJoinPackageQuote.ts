import { applyPaidTrialCredit } from "@/lib/billing/applyPaidTrialCredit";
import { sectionIsClassPackBilled } from "@/lib/billing/sectionBillingMode";
import { pickJoinPackageMonth } from "@/lib/register/pickJoinPackageMonth";
import { sectionHasRemainingClassThisMonth } from "@/lib/register/sectionHasRemainingClassThisMonth";
import {
  buildRegistrationFeeSnapshot,
  type RegistrationFeeMode,
  type RegistrationFeeSnapshot,
} from "@/lib/register/registrationFeeSnapshot";
import type { JoinPackageTuitionLine } from "@/lib/register/parseJoinPackageSnapshot";
import type { SectionScheduleSlot } from "@/types/academics";

export type JoinPackageSectionInput = {
  id: string;
  name: string;
  sectionAmount: number | null;
  cohortDefault: number | null;
  monthlyAmount: number;
  billingMode: string | null;
  slots: SectionScheduleSlot[];
  startsOn: string | null;
  endsOn: string | null;
};

export type JoinPackageSnapshot = RegistrationFeeSnapshot & {
  kind: "join_package";
  enrollment: { lines: RegistrationFeeSnapshot["lines"] };
  tuition: JoinPackageTuitionLine[];
  trialCreditApplied: number;
};

export function planJoinPackageQuote(input: {
  mode: RegistrationFeeMode;
  currency?: string;
  nowIso: string;
  now: Date;
  timeZone: string;
  sections: JoinPackageSectionInput[];
  alreadyCoveredSectionIds?: string[];
  onceForAllAlreadyCovered?: boolean;
  sharedAmount?: number;
  alreadyPaidMonthIds?: string[];
  trialPaid?: number;
  trialAlreadyCredited?: number;
  creditEnabled?: boolean;
}): JoinPackageSnapshot {
  const enrollment = buildRegistrationFeeSnapshot({
    mode: input.mode,
    currency: input.currency,
    nowIso: input.nowIso,
    sections: input.sections,
    alreadyCoveredSectionIds: input.alreadyCoveredSectionIds,
    onceForAllAlreadyCovered: input.onceForAllAlreadyCovered,
    sharedAmount: input.sections.length === 0 ? 0 : input.sharedAmount,
  });
  const paidMonths = new Set(input.alreadyPaidMonthIds ?? []);
  const tuition: JoinPackageTuitionLine[] = [];
  if (input.sections.length > 0) {
    for (const section of input.sections) {
      if (sectionIsClassPackBilled(section.billingMode)) continue;
      if (paidMonths.has(section.id)) continue;
      const amount = Math.max(0, Number(section.monthlyAmount) || 0);
      if (amount <= 0) continue;
      const month = pickJoinPackageMonth({
        hasRemainingClassThisMonth: sectionHasRemainingClassThisMonth({
          slots: section.slots,
          startsOn: section.startsOn,
          endsOn: section.endsOn,
          now: input.now,
          timeZone: input.timeZone,
        }),
        sectionStartsOn: section.startsOn,
        sectionEndsOn: section.endsOn,
        now: input.now,
        timeZone: input.timeZone,
      });
      if (!month) continue;
      tuition.push({
        sectionId: section.id,
        sectionName: section.name,
        year: month.year,
        month: month.month,
        amount,
      });
    }
  }
  const enrollmentDue = enrollment.lines.reduce((sum, line) => sum + line.amount, 0);
  const tuitionDue = tuition.reduce((sum, line) => sum + line.amount, 0);
  const credited = applyPaidTrialCredit({
    enrollmentDue,
    tuitionDue,
    trialPaid: input.trialPaid ?? 0,
    alreadyCredited: input.trialAlreadyCredited ?? 0,
    enabled: input.creditEnabled === true,
  });
  return {
    ...enrollment,
    kind: "join_package",
    total: credited.total,
    enrollment: { lines: enrollment.lines },
    tuition,
    trialCreditApplied: credited.creditApplied,
  };
}
