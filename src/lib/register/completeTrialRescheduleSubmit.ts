import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { mapRegistrationSectionPickerRows } from "@/lib/register/registrationSectionPicker";
import { planTrialSeats, buildTrialFeeSnapshot } from "@/lib/register/trialSubmitPlan";
import { planTrialRescheduleMoney } from "@/lib/register/planTrialRescheduleMoney";
import { loadTrialSubmitFacts } from "@/lib/register/loadTrialSubmitFacts";
import { parseRequestedSectionIds } from "@/lib/register/parseRequestedSectionIds";
import { notifyTrialRescheduled } from "@/lib/register/notifyTrialRescheduled";

export async function completeTrialRescheduleSubmit(input: {
  locale: string;
  dict: Dictionary;
  supabase: SupabaseClient;
  admin: SupabaseClient;
  rescheduleToken: string;
  sectionIds: string[];
  now?: Date;
}): Promise<{ ok: boolean; message?: string; payToken?: string }> {
  const { data: lead, error } = await input.admin
    .from("registrations")
    .select(
      "id, intent, status, trial_fee_captured, trial_fee_snapshot, pay_token, first_name, last_name, email, tutor_name, tutor_email, birth_date, dni",
    )
    .eq("trial_reschedule_token", input.rescheduleToken)
    .eq("intent", "trial")
    .maybeSingle();
  if (error || !lead || lead.status === "enrolled") {
    return { ok: false, message: input.dict.register.trial.rescheduleInvalid };
  }

  const { data: existing } = await input.admin
    .from("registration_trial_seats")
    .select("id, section_id, status, trial_fee_amount, scheduled_on")
    .eq("registration_id", lead.id);
  const seats = existing ?? [];
  if (!seats.some((row) => row.status === "absent")) {
    return { ok: false, message: input.dict.register.trial.rescheduleInvalid };
  }

  const parsed = parseRequestedSectionIds({
    selectedIds: input.sectionIds,
    sectionOptionsOrder: input.sectionIds,
    allowUndecided: false,
  });
  if (!parsed.ok || !parsed.preferredSectionId) {
    return { ok: false, message: input.dict.register.trial.needsSection };
  }
  const sectionIds = [parsed.preferredSectionId, ...parsed.additionalSectionIds];
  const { data: pickerRows } = await input.supabase.rpc("list_registration_section_picker_options");
  const options = mapRegistrationSectionPickerRows(pickerRows);
  const now = input.now ?? new Date();
  const facts = await loadTrialSubmitFacts(input.admin, {
    studentId: null,
    dni: String(lead.dni ?? ""),
    sectionIds,
  });
  const planned = planTrialSeats({
    options,
    sectionIds,
    amountsBySectionId: facts.amountsBySectionId,
    now,
    timeZone: getInstituteTimeZone(),
  });
  if (!planned.ok) {
    return { ok: false, message: input.dict.register.trial.sectionUnavailable };
  }

  const collide = new Set(
    seats
      .filter((row) => row.status === "booked" || row.status === "attended")
      .map((row) => `${row.section_id}:${row.scheduled_on}`),
  );
  const fresh = planned.seats.filter(
    (seat) => !collide.has(`${seat.sectionId}:${seat.scheduledOn}`),
  );
  if (fresh.length === 0) {
    return { ok: false, message: input.dict.register.trial.sectionUnavailable };
  }

  const { error: insertErr } = await input.admin.from("registration_trial_seats").insert(
    fresh.map((seat) => ({
      registration_id: lead.id,
      section_id: seat.sectionId,
      day_of_week: seat.dayOfWeek,
      start_time: seat.startTime,
      end_time: seat.endTime,
      scheduled_on: seat.scheduledOn,
      trial_fee_amount: seat.trialFeeAmount,
      status: "booked",
    })),
  );
  if (insertErr) return { ok: false, message: input.dict.actionErrors.register.insertFailed };

  const heldAmounts = seats
    .filter((row) => row.status === "booked" || row.status === "attended")
    .map((row) => Number(row.trial_fee_amount ?? 0));
  const newQuote = [...heldAmounts, ...fresh.map((seat) => seat.trialFeeAmount)].reduce(
    (sum, n) => sum + n,
    0,
  );
  const capturedSnap = (lead.trial_fee_snapshot ?? {}) as {
    total?: unknown;
    currency?: unknown;
    paidTotal?: unknown;
  };
  const capturedTotal =
    lead.trial_fee_captured === true
      ? Number(capturedSnap.paidTotal ?? capturedSnap.total ?? 0) || 0
      : 0;
  const currency = facts.currency || String(capturedSnap.currency ?? "USD");
  const money = planTrialRescheduleMoney({
    capturedTotal,
    newQuoteTotal: newQuote,
    currency,
  });

  const patch: Record<string, unknown> = {};
  if (money.kind === "pay_delta") {
    patch.trial_fee_snapshot = {
      kind: "trial_fee_delta",
      currency: money.currency,
      total: money.amount,
      seats: buildTrialFeeSnapshot({ currency: money.currency, seats: fresh }).seats,
    };
  } else if (money.kind === "refund_due") {
    patch.trial_refund_due_amount = money.amount;
  }
  if (Object.keys(patch).length) {
    await input.admin.from("registrations").update(patch).eq("id", lead.id);
  }

  void notifyTrialRescheduled({
    locale: input.locale,
    dict: input.dict,
    lead: {
      firstName: String(lead.first_name ?? ""),
      lastName: String(lead.last_name ?? ""),
      email: lead.email == null ? null : String(lead.email),
      tutorName: lead.tutor_name == null ? null : String(lead.tutor_name),
      tutorEmail: lead.tutor_email == null ? null : String(lead.tutor_email),
      birthDate: lead.birth_date == null ? null : String(lead.birth_date).slice(0, 10),
    },
    sectionLabel: fresh.map((seat) => seat.label).join(" · "),
    payToken: money.kind === "pay_delta" ? String(lead.pay_token ?? "") : "",
    deltaAmount: money.kind === "pay_delta" ? money.amount : 0,
    currency,
  });

  return {
    ok: true,
    payToken: money.kind === "pay_delta" ? String(lead.pay_token ?? "") : undefined,
  };
}
