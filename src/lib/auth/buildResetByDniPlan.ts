import { normalizeDni } from "@/lib/import/studentImportUtils";
import { isParentSyntheticEmail } from "@/lib/import/parentDefaultEmail";

const LEGACY_STUDENT_SYNTHETIC_SUFFIX = "@students.goldenenglish.local";

export interface BuildResetByDniPlanInput {
  dni: string;
  currentEmail: string | null | undefined;
}

export interface ResetByDniPlan {
  generatedPassword: string;
  hasRealEmail: boolean;
}

function isSyntheticAuthEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.endsWith(LEGACY_STUDENT_SYNTHETIC_SUFFIX)) return true;
  return isParentSyntheticEmail(trimmed);
}

export function buildResetByDniPlan({
  dni,
  currentEmail,
}: BuildResetByDniPlanInput): ResetByDniPlan {
  const { password } = normalizeDni(dni);
  const trimmed = (currentEmail ?? "").trim().toLowerCase();
  if (trimmed.length === 0) {
    return { generatedPassword: password, hasRealEmail: false };
  }
  if (isSyntheticAuthEmail(trimmed)) {
    return { generatedPassword: password, hasRealEmail: false };
  }
  return { generatedPassword: password, hasRealEmail: true };
}
