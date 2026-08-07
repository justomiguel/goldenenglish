import type { Dictionary } from "@/types/i18n";

export function resolveAcademicSectionPageSubdicts(
  dict: Dictionary,
  enFallback: Dictionary,
) {
  const d = dict.dashboard.academicSectionPage;
  const dEn = enFallback.dashboard.academicSectionPage;
  return {
    shellTabLabels: d.shellTabs ?? dEn.shellTabs,
    settingsSummaryDict: d.settingsSummary ?? dEn.settingsSummary,
    scheduleEditorDict: d.scheduleEditor ?? dEn.scheduleEditor,
    periodDict: d.period ?? dEn.period,
    capacityDict: d.capacity ?? dEn.capacity,
    minAttendanceDict: d.minAttendance ?? dEn.minAttendance,
    roomLabelDict: d.roomLabel ?? dEn.roomLabel,
    nameEditorDict: d.nameEditor ?? dEn.nameEditor,
    lifecycleDict: d.lifecycle ?? dEn.lifecycle,
    staffDict: d.staff ?? dEn.staff,
    feePlansDict: d.feePlans ?? dEn.feePlans,
    enrollmentFeeDict: d.enrollmentFee ?? dEn.enrollmentFee,
    monthlyFeeChargeModeDict: d.monthlyFeeChargeMode ?? dEn.monthlyFeeChargeMode,
    allowAdvanceMonthlyPaymentDict:
      d.allowAdvanceMonthlyPayment ?? dEn.allowAdvanceMonthlyPayment,
    feesPanelDict: d.feesPanel ?? dEn.feesPanel,
    featureFlagsDict: d.featureFlags ?? dEn.featureFlags,
    learningRouteDict: d.learningRoute ?? dEn.learningRoute,
    staffAssignedChipsDict: d.staffAssignedChips ?? dEn.staffAssignedChips,
    healthDict: d.health ?? dEn.health,
    studentsPanelDict: d.studentsPanel ?? dEn.studentsPanel,
  };
}
