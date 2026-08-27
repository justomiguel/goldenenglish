import type { SupabaseClient } from "@supabase/supabase-js";
import { parseNagoTenantExtras } from "@/lib/register/packs/nago/parseNagoTenantExtras";
import {
  formatNagoCareDietNote,
  formatNagoCareHealthNote,
  formatNagoHomeAddress,
} from "@/lib/register/packs/nago/formatNagoFichaFields";
import type { NagoCareNoteLabels } from "@/lib/register/packs/nago/types";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

function isBlank(value: unknown): boolean {
  return String(value ?? "").trim() === "";
}

export async function applyNagoExtrasOnAccept(input: {
  admin: SupabaseClient;
  studentId: string;
  tenantExtras: unknown;
  labels: NagoCareNoteLabels;
}): Promise<void> {
  const extras = parseNagoTenantExtras(input.tenantExtras);
  if (!extras) return;

  const { data, error } = await input.admin
    .from("profiles")
    .select("home_address_text, care_health_note, care_diet_note")
    .eq("id", input.studentId)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("applyNagoExtrasOnAccept:select", error, {
      studentId: input.studentId,
    });
    return;
  }

  const patch: Record<string, string> = {};
  if (isBlank(data?.home_address_text)) {
    patch.home_address_text = formatNagoHomeAddress(extras);
  }
  if (isBlank(data?.care_health_note)) {
    patch.care_health_note = formatNagoCareHealthNote(extras, input.labels);
  }
  if (isBlank(data?.care_diet_note)) {
    patch.care_diet_note = formatNagoCareDietNote(extras, input.labels);
  }
  if (Object.keys(patch).length === 0) return;

  const { error: updateError } = await input.admin
    .from("profiles")
    .update(patch)
    .eq("id", input.studentId);

  if (updateError) {
    logSupabaseClientError("applyNagoExtrasOnAccept:update", updateError, {
      studentId: input.studentId,
    });
  }
}

export function nagoCareLabelsFromRegisterDict(pack: {
  careInsurance: string;
  careBloodType: string;
  careCondition: string;
  careHealthCenter: string;
  careAllergies: string;
  careNone: string;
}): NagoCareNoteLabels {
  return {
    insurance: pack.careInsurance,
    bloodType: pack.careBloodType,
    condition: pack.careCondition,
    healthCenter: pack.careHealthCenter,
    allergies: pack.careAllergies,
    none: pack.careNone,
  };
}

