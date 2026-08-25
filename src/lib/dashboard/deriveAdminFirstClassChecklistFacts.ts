import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import type {
  AdminFirstClassChecklistContext,
  AdminFirstClassChecklistFacts,
  AdminFirstClassChecklistSectionTarget,
} from "@/lib/dashboard/evaluateAdminFirstClassChecklist";

export type AdminFirstClassChecklistSectionRaw = {
  id?: string;
  cohortId?: string;
  teacherId: string | null;
  scheduleSlots: unknown;
  enrollmentFeeAmount: number | string | null;
  billingMode: string | null;
};

export type AdminFirstClassChecklistRaw = {
  studentCount: number;
  teacherCount: number;
  activeCohortCount: number;
  sections: AdminFirstClassChecklistSectionRaw[];
  activeEnrollmentCount: number;
  hasMonthlyFeePlan: boolean;
  hasClassPackPrice: boolean;
  bankTransferInstructions: string | null;
  enabledGatewayCount: number;
};

function hasPositiveAmount(raw: number | string | null): boolean {
  if (raw == null) return false;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0;
}

export function sectionHasFees(
  section: AdminFirstClassChecklistSectionRaw,
  extras: Pick<AdminFirstClassChecklistRaw, "hasMonthlyFeePlan" | "hasClassPackPrice">,
): boolean {
  if (hasPositiveAmount(section.enrollmentFeeAmount)) return true;
  if (extras.hasMonthlyFeePlan) return true;
  return section.billingMode === "class_pack" && extras.hasClassPackPrice;
}

export function buildAdminFirstClassChecklistContext(
  firstCohortId: string | null,
  sections: AdminFirstClassChecklistSectionRaw[],
  extras: Pick<AdminFirstClassChecklistRaw, "hasMonthlyFeePlan" | "hasClassPackPrice">,
): AdminFirstClassChecklistContext {
  const targets: AdminFirstClassChecklistSectionTarget[] = [];
  for (const section of sections) {
    if (!section.id || !section.cohortId) continue;
    targets.push({
      id: section.id,
      cohortId: section.cohortId,
      hasTeacher: Boolean(section.teacherId),
      hasSchedule: parseSectionScheduleSlots(section.scheduleSlots).length > 0,
      hasFees: sectionHasFees(section, extras),
    });
  }
  return { firstCohortId, sections: targets };
}

export function deriveAdminFirstClassChecklistFacts(
  raw: AdminFirstClassChecklistRaw,
): AdminFirstClassChecklistFacts {
  const sections = raw.sections;
  return {
    hasStudent: raw.studentCount > 0,
    hasTeacher: raw.teacherCount > 0,
    hasCohort: raw.activeCohortCount > 0,
    hasSection: sections.length > 0,
    hasTeacherAssignedToSection: sections.some((s) => Boolean(s.teacherId)),
    hasStudentEnrolledInSection: raw.activeEnrollmentCount > 0,
    hasSectionSchedule: sections.some(
      (s) => parseSectionScheduleSlots(s.scheduleSlots).length > 0,
    ),
    hasSectionFees:
      raw.hasMonthlyFeePlan ||
      sections.some((s) => sectionHasFees(s, raw)),
    hasPaymentMethod:
      raw.enabledGatewayCount > 0 ||
      Boolean(raw.bankTransferInstructions?.trim()),
  };
}
