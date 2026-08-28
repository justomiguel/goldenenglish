import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";
import { normalizeDni } from "@/lib/import/studentImportUtils";

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
  return {
    generatedPassword: password,
    hasRealEmail: isDeliverableAuthEmail(currentEmail),
  };
}
