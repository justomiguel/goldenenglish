import { normalizeDni } from "@/lib/import/studentImportUtils";

const SYNTHETIC_DOMAINS = [
  "@students.goldenenglish.local",
  "@parents.goldenenglish.local",
] as const;

export interface BuildResetByDniPlanInput {
  dni: string;
  currentEmail: string | null | undefined;
}

export interface ResetByDniPlan {
  generatedPassword: string;
  hasRealEmail: boolean;
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
  for (const suffix of SYNTHETIC_DOMAINS) {
    if (trimmed.endsWith(suffix)) {
      return { generatedPassword: password, hasRealEmail: false };
    }
  }
  return { generatedPassword: password, hasRealEmail: true };
}
