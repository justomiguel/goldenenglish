import { nextTrialScheduledOn } from "@/lib/register/nextTrialScheduledOn";
import type { RegistrationSectionPickerOption } from "@/lib/register/registrationSectionPicker";

export type TrialDniGate =
  | { ok: true }
  | { ok: false; code: "already_enrolled" | "open_trial" };

export type PlannedTrialSeat = {
  sectionId: string;
  label: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  scheduledOn: string;
  trialFeeAmount: number;
};

export type TrialFeeSnapshot = {
  kind: "trial_fee";
  currency: string;
  total: number;
  seats: { sectionId: string; amount: number }[];
};

export function evaluateTrialDniGate(input: {
  requestedSectionIds: string[];
  enrolledSectionIds: string[];
  hasOpenTrial: boolean;
}): TrialDniGate {
  const requested = new Set(input.requestedSectionIds);
  if (input.enrolledSectionIds.some((id) => requested.has(id))) {
    return { ok: false, code: "already_enrolled" };
  }
  if (input.hasOpenTrial) return { ok: false, code: "open_trial" };
  return { ok: true };
}

function pickNextSlot(
  option: RegistrationSectionPickerOption,
  now: Date,
  timeZone: string,
): PlannedTrialSeat | null {
  if (!option.hasOpenSeat || !option.offersTrial || option.slots.length === 0) return null;
  let best: PlannedTrialSeat | null = null;
  for (const slot of option.slots) {
    const scheduledOn = nextTrialScheduledOn(now, slot.dayOfWeek, slot.startTime, timeZone);
    const candidate: PlannedTrialSeat = {
      sectionId: option.id,
      label: option.label,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      scheduledOn,
      trialFeeAmount: 0,
    };
    if (
      !best ||
      candidate.scheduledOn < best.scheduledOn ||
      (candidate.scheduledOn === best.scheduledOn && candidate.startTime < best.startTime)
    ) {
      best = candidate;
    }
  }
  return best;
}

export function planTrialSeats(input: {
  options: RegistrationSectionPickerOption[];
  sectionIds: string[];
  amountsBySectionId: Record<string, number>;
  now: Date;
  timeZone: string;
}): { ok: true; seats: PlannedTrialSeat[] } | { ok: false; code: "no_section" | "section_unavailable" } {
  const ids = [...new Set(input.sectionIds.filter(Boolean))];
  if (ids.length === 0) return { ok: false, code: "no_section" };
  const byId = new Map(input.options.map((o) => [o.id, o]));
  const seats: PlannedTrialSeat[] = [];
  for (const id of ids) {
    const option = byId.get(id);
    if (!option) return { ok: false, code: "section_unavailable" };
    const seat = pickNextSlot(option, input.now, input.timeZone);
    if (!seat) return { ok: false, code: "section_unavailable" };
    seats.push({
      ...seat,
      trialFeeAmount: input.amountsBySectionId[id] ?? 0,
    });
  }
  return { ok: true, seats };
}

export function buildTrialFeeSnapshot(input: {
  currency: string;
  seats: PlannedTrialSeat[];
}): TrialFeeSnapshot {
  return {
    kind: "trial_fee",
    currency: input.currency,
    total: input.seats.reduce((sum, seat) => sum + seat.trialFeeAmount, 0),
    seats: input.seats.map((seat) => ({
      sectionId: seat.sectionId,
      amount: seat.trialFeeAmount,
    })),
  };
}
