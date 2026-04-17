import type { Dictionary } from "@/types/i18n";
import { isRegistrationUndecidedStored } from "@/lib/register/registrationSectionConstants";

type Labels = Pick<
  Dictionary["admin"]["registrations"],
  "emptyValue" | "levelInterestUndecided"
>;

export function formatRegistrationLevelInterestDisplay(
  labels: Labels,
  raw: string | null | undefined,
): string {
  if (raw == null || String(raw).trim() === "") return labels.emptyValue;
  if (isRegistrationUndecidedStored(raw)) return labels.levelInterestUndecided;
  return String(raw);
}
