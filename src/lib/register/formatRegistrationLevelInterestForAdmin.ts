import { isRegistrationUndecidedStored } from "@/lib/register/registrationSectionConstants";

export function formatRegistrationLevelInterestForAdmin(
  levelInterest: string | null | undefined,
  labels: { levelInterestUndecided: string; emptyValue: string },
): string {
  const t = levelInterest != null ? String(levelInterest).trim() : "";
  if (!t) return labels.emptyValue;
  if (isRegistrationUndecidedStored(t)) return labels.levelInterestUndecided;
  return t;
}
