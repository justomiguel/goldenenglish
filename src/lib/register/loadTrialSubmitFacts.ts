import type { SupabaseClient } from "@supabase/supabase-js";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { parseOptionalFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";
import { normalizeRegistrationDocument } from "@/lib/register/normalizeRegistrationDocument";
import { resolveSectionTrialOffer } from "@/lib/register/resolveSectionTrialOffer";

export async function loadTrialSubmitFacts(
  admin: SupabaseClient,
  input: {
    studentId: string | null;
    dni: string;
    sectionIds: string[];
  },
): Promise<{
  enrolledSectionIds: string[];
  hasOpenTrial: boolean;
  amountsBySectionId: Record<string, number>;
  currency: string;
}> {
  const [{ currency }, enrolledSectionIds, hasOpenTrial, amountsBySectionId] = await Promise.all([
    loadBillingCurrencySetting(admin),
    loadEnrolledSectionIds(admin, input.studentId, input.sectionIds),
    loadHasOpenTrial(admin, input.dni),
    loadTrialAmounts(admin, input.sectionIds),
  ]);
  return { enrolledSectionIds, hasOpenTrial, amountsBySectionId, currency };
}

async function loadEnrolledSectionIds(
  admin: SupabaseClient,
  studentId: string | null,
  sectionIds: string[],
): Promise<string[]> {
  if (!studentId || sectionIds.length === 0) return [];
  const { data } = await admin
    .from("section_enrollments")
    .select("section_id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .in("section_id", sectionIds);
  return (data ?? []).map((row) => String((row as { section_id: string }).section_id));
}

async function loadHasOpenTrial(admin: SupabaseClient, dni: string): Promise<boolean> {
  const raw = dni.trim();
  const norm = normalizeRegistrationDocument(dni);
  const variants = [...new Set([raw, norm].filter(Boolean))];
  if (variants.length === 0) return false;
  const { data } = await admin
    .from("registrations")
    .select("id, registration_trial_seats(status)")
    .eq("intent", "trial")
    .neq("status", "enrolled")
    .in("dni", variants);
  return (data ?? []).some((row) => {
    const seats = (row as { registration_trial_seats?: { status?: string }[] }).registration_trial_seats ?? [];
    return seats.some((seat) => seat.status === "booked" || seat.status === "attended");
  });
}

async function loadTrialAmounts(
  admin: SupabaseClient,
  sectionIds: string[],
): Promise<Record<string, number>> {
  if (sectionIds.length === 0) return {};
  const { data } = await admin
    .from("academic_sections")
    .select("id, offers_trial, trial_fee_amount, academic_cohorts(offers_trial, trial_fee_amount)")
    .in("id", sectionIds);
  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    const r = row as {
      id: string;
      offers_trial?: boolean | null;
      trial_fee_amount?: number | string | null;
      academic_cohorts?:
        | { offers_trial?: boolean | null; trial_fee_amount?: number | string | null }
        | { offers_trial?: boolean | null; trial_fee_amount?: number | string | null }[]
        | null;
    };
    const cohortRaw = Array.isArray(r.academic_cohorts) ? r.academic_cohorts[0] : r.academic_cohorts;
    const resolved = resolveSectionTrialOffer(
      {
        offersTrial: r.offers_trial ?? null,
        trialFeeAmount: parseOptionalFeeAmount(r.trial_fee_amount),
      },
      {
        offersTrial: cohortRaw?.offers_trial === true,
        trialFeeAmount: parseOptionalFeeAmount(cohortRaw?.trial_fee_amount) ?? 0,
      },
    );
    out[String(r.id)] = resolved.offers ? resolved.amount : 0;
  }
  return out;
}
