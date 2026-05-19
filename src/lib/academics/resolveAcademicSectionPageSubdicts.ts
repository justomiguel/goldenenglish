import type { Dictionary } from "@/types/i18n";

export function resolveAcademicSectionPageSubdicts(
  dict: Dictionary,
  enFallback: Dictionary,
) {
  const d = dict.dashboard.academicSectionPage;
  const dEn = enFallback.dashboard.academicSectionPage;
  return {
    shellTabLabels: d.shellTabs ?? dEn.shellTabs,
    scheduleEditorDict: d.scheduleEditor ?? dEn.scheduleEditor,
    periodDict: d.period ?? dEn.period,
    capacityDict: d.capacity ?? dEn.capacity,
    minAttendanceDict: d.minAttendance ?? dEn.minAttendance,
    roomLabelDict: d.roomLabel ?? dEn.roomLabel,
    lifecycleDict: d.lifecycle ?? dEn.lifecycle,
    staffDict: d.staff ?? dEn.staff,
    feePlansDict: d.feePlans ?? dEn.feePlans,
    enrollmentFeeDict: d.enrollmentFee ?? dEn.enrollmentFee,
    monthlyFeeChargeModeDict: d.monthlyFeeChargeMode ?? dEn.monthlyFeeChargeMode,
    allowAdvanceMonthlyPaymentDict:
      d.allowAdvanceMonthlyPayment ?? dEn.allowAdvanceMonthlyPayment,
    learningRouteDict: d.learningRoute ?? dEn.learningRoute,
    staffAssignedChipsDict: d.staffAssignedChips ?? dEn.staffAssignedChips,
    healthDict: d.health ?? dEn.health,
  };
}
