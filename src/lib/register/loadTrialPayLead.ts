import type { SupabaseClient } from "@supabase/supabase-js";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { familyEmailForTrialLead } from "@/lib/register/notifyTrialSeatMails";

export type TrialPayLead = {
  id: string;
  intent: string;
  status: string;
  trialFeeCaptured: boolean;
  snapshotKind: string;
  snapshotTotal: number;
  snapshotCurrency: string;
  preferredSectionId: string | null;
  additionalSectionIds: string[];
  firstName: string;
  lastName: string;
  familyEmail: string | null;
};

export function requestedIdsFromTrialPayLead(lead: TrialPayLead): string[] {
  return [lead.preferredSectionId, ...lead.additionalSectionIds].filter(
    (id): id is string => Boolean(id),
  );
}

export async function loadTrialPayLeadByToken(
  admin: SupabaseClient,
  payToken: string,
): Promise<TrialPayLead | null> {
  const { data, error } = await admin
    .from("registrations")
    .select(
      "id, intent, status, trial_fee_captured, trial_fee_snapshot, preferred_section_id, additional_section_ids, first_name, last_name, email, tutor_email, tutor_name, birth_date",
    )
    .eq("pay_token", payToken)
    .eq("intent", "trial")
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  const snapshot = (row.trial_fee_snapshot ?? {}) as {
    kind?: unknown;
    total?: unknown;
    currency?: unknown;
  };
  const birth = row.birth_date ? String(row.birth_date).slice(0, 10) : "";
  const isMinor = birth
    ? fullYearsFromIsoDate(birth) < getLegalAgeMajorityFromSystem()
    : false;
  const extra = row.additional_section_ids;
  return {
    id: String(row.id),
    intent: String(row.intent ?? "trial"),
    status: String(row.status ?? "new"),
    trialFeeCaptured: row.trial_fee_captured === true,
    snapshotKind: String(snapshot.kind ?? "trial_fee"),
    snapshotTotal: Number(snapshot.total ?? 0) || 0,
    snapshotCurrency: String(snapshot.currency ?? "USD"),
    preferredSectionId:
      row.preferred_section_id == null ? null : String(row.preferred_section_id),
    additionalSectionIds: Array.isArray(extra) ? extra.map(String).filter(Boolean) : [],
    firstName: String(row.first_name ?? "").trim(),
    lastName: String(row.last_name ?? "").trim(),
    familyEmail: familyEmailForTrialLead({
      isMinor,
      studentEmail: row.email == null ? null : String(row.email),
      tutorEmail: row.tutor_email == null ? null : String(row.tutor_email),
    }),
  };
}
