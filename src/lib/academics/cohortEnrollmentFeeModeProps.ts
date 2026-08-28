import {
  parseOptionalFeeAmount,
  resolveEffectiveEnrollmentFeeAmount,
} from "@/lib/billing/resolveCohortFeeDefaults";
import { canCohortUseOnceForAll } from "@/lib/register/registrationFeeSnapshot";

export function cohortEnrollmentFeeModeFromRow(raw: unknown): "per_section" | "once_for_all" {
  return raw === "once_for_all" ? "once_for_all" : "per_section";
}

export function canCohortSaveOnceForAll(input: {
  sectionEnrollmentAmounts: unknown[];
  cohortDefault: unknown;
}): boolean {
  const cohortDefault = parseOptionalFeeAmount(input.cohortDefault);
  return canCohortUseOnceForAll(
    input.sectionEnrollmentAmounts.map((amount) =>
      resolveEffectiveEnrollmentFeeAmount(parseOptionalFeeAmount(amount), cohortDefault),
    ),
  );
}
