import {
  ACADEMIC_SECTION_SHELL_HUB_AREA_ORDER,
  type AcademicSectionShellAreaId,
  type AcademicSectionShellTabId,
} from "@/lib/academics/academicSectionShellTabOrder";

export interface AcademicSectionFeatureFlags {
  requiresEvaluationsToPass: boolean;
  usesLearningRoute: boolean;
}

export function visibleAcademicSectionHubAreas(
  flags: AcademicSectionFeatureFlags,
): AcademicSectionShellAreaId[] {
  return ACADEMIC_SECTION_SHELL_HUB_AREA_ORDER.filter((area) => {
    if (area === "evaluations") return flags.requiresEvaluationsToPass;
    if (area === "learningRoute") return flags.usesLearningRoute;
    return true;
  });
}

/** @deprecated Prefer `visibleAcademicSectionHubAreas` (hub has no `general` tab). */
export function visibleAcademicSectionShellTabs(
  flags: AcademicSectionFeatureFlags,
): AcademicSectionShellAreaId[] {
  return visibleAcademicSectionHubAreas(flags);
}

/**
 * Resolves a `?tab=` value to a drill-down area, or `null` for the hub.
 * `general` and hidden/invalid ids map to the hub.
 */
export function resolveAcademicSectionShellArea(
  requested: AcademicSectionShellTabId | undefined,
  flags: AcademicSectionFeatureFlags,
): AcademicSectionShellAreaId | null {
  if (!requested || requested === "general") return null;
  const visible = visibleAcademicSectionHubAreas(flags);
  return visible.includes(requested) ? requested : null;
}

/** @deprecated Prefer `resolveAcademicSectionShellArea` (`null` = hub). */
export function resolveAcademicSectionShellTab(
  requested: AcademicSectionShellTabId | undefined,
  flags: AcademicSectionFeatureFlags,
): AcademicSectionShellTabId {
  return resolveAcademicSectionShellArea(requested, flags) ?? "general";
}
