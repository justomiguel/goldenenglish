import type { SupabaseClient } from "@supabase/supabase-js";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { notifyRegistrationScheduleOffer } from "@/lib/register/notifyRegistrationScheduleOffer";
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";
import { loadRegistrationIntakeLead } from "@/lib/register/registrationIntakeActionSupport";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import type { Dictionary } from "@/types/i18n";

export async function proposeRegistrationScheduleCore(input: {
  admin: SupabaseClient;
  locale: string;
  dict: Dictionary;
  registrationId: string;
  sectionId: string;
}): Promise<
  | { ok: true }
  | { ok: false; code: "not_found" | "not_actionable" | "section_full" | "same_section" | "save_failed" }
> {
  const lead = await loadRegistrationIntakeLead(input.admin, input.registrationId);
  if (!lead) return { ok: false, code: "not_found" };
  if (!registrationIsActionable(lead.status)) return { ok: false, code: "not_actionable" };
  if (input.sectionId === lead.preferred_section_id) return { ok: false, code: "same_section" };

  const open = await requestedSectionsHaveOpenSeats(input.admin, [input.sectionId]);
  if (!open) return { ok: false, code: "section_full" };

  const { error } = await input.admin
    .from("registrations")
    .update({
      proposed_section_id: input.sectionId,
      intake_state: "offer_pending",
    })
    .eq("id", lead.id);
  if (error) {
    logSupabaseClientError("proposeRegistrationSchedule:update", error, {
      registrationId: lead.id,
    });
    return { ok: false, code: "save_failed" };
  }

  try {
    const fallback = input.dict.register.enrollmentPayUndecidedSection;
    const originalSectionName = await resolveSectionLabel(
      input.admin,
      lead.preferred_section_id,
      fallback,
    );
    const proposedSectionName = await resolveSectionLabel(input.admin, input.sectionId, fallback);
    void notifyRegistrationScheduleOffer({
      locale: input.locale,
      dict: input.dict,
      lead,
      originalSectionName,
      proposedSectionName,
      proposedScheduleLabel: proposedSectionName,
    });
  } catch {
    /* Write already committed; mail/label must not fail the propose. */
  }
  void recordSystemAudit({
    action: "registration_schedule_offered",
    resourceType: "registration",
    resourceId: lead.id,
    payload: { proposed_section_id: input.sectionId },
  });
  return { ok: true };
}

async function resolveSectionLabel(
  admin: SupabaseClient,
  sectionId: string | null,
  fallback: string,
): Promise<string> {
  if (!sectionId) return fallback;
  const { data } = await admin.rpc("registration_public_section_label", {
    p_section_id: sectionId,
  });
  return data ? String(data) : fallback;
}
