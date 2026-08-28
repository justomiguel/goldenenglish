import type { SupabaseClient } from "@supabase/supabase-js";
import { buildRegistrationEnrollmentFeeInsertFields } from "@/lib/register/buildRegistrationEnrollmentFeeInsertFields";
import {
  loadRegistrationPayLeadByToken,
} from "@/lib/register/loadRegistrationPayLeadByToken";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type SwitchRegistrationPaySectionResult =
  | { ok: true; needsAccept: boolean; intakeState: string; registrationId: string }
  | { ok: false; code: "not_found" | "enrolled" | "section_full" | "update_failed" };

export async function switchRegistrationPaySectionCore(input: {
  admin: SupabaseClient;
  payToken: string;
  sectionId: string;
  nowIso: string;
}): Promise<SwitchRegistrationPaySectionResult> {
  const lead = await loadRegistrationPayLeadByToken(input.admin, input.payToken);
  if (!lead) return { ok: false, code: "not_found" };
  if (lead.status === "enrolled") return { ok: false, code: "enrolled" };

  const sectionId = input.sectionId.trim();
  if (!sectionId) return { ok: false, code: "section_full" };

  const open = await requestedSectionsHaveOpenSeats(input.admin, [sectionId]);
  if (!open) return { ok: false, code: "section_full" };

  const quoted = await buildRegistrationEnrollmentFeeInsertFields({
    admin: input.admin,
    sectionIds: [sectionId],
    nowIso: input.nowIso,
  });
  const additional = lead.additionalSectionIds.filter((id) => id !== sectionId);

  const { error } = await input.admin
    .from("registrations")
    .update({
      preferred_section_id: sectionId,
      additional_section_ids: additional,
      fee_snapshot: quoted.fee_snapshot,
      intake_state: quoted.intake_state,
    })
    .eq("id", lead.id);
  if (error) {
    logSupabaseClientError("switchRegistrationPaySection:update", error, {
      registrationId: lead.id,
    });
    return { ok: false, code: "update_failed" };
  }

  return {
    ok: true,
    needsAccept: lead.feeCaptured,
    intakeState: quoted.intake_state,
    registrationId: lead.id,
  };
}
