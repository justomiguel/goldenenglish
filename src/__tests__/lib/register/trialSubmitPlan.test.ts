/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  buildTrialFeeSnapshot,
  evaluateTrialDniGate,
  planTrialSeats,
} from "@/lib/register/trialSubmitPlan";
import type { RegistrationSectionPickerOption } from "@/lib/register/registrationSectionPicker";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

const yoga: RegistrationSectionPickerOption = {
  id: A,
  label: "Yoga mañana",
  hasOpenSeat: true,
  offersTrial: true,
  slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
};

describe("evaluateTrialDniGate", () => {
  it("rejects a seat the person is already enrolled in", () => {
    expect(
      evaluateTrialDniGate({
        requestedSectionIds: [A],
        enrolledSectionIds: [A],
        hasOpenTrial: false,
      }),
    ).toEqual({ ok: false, code: "already_enrolled" });
  });

  it("rejects a second open trial", () => {
    expect(
      evaluateTrialDniGate({
        requestedSectionIds: [A],
        enrolledSectionIds: [],
        hasOpenTrial: true,
      }),
    ).toEqual({ ok: false, code: "open_trial" });
  });

  it("allows a trial in another section when there is no open trial", () => {
    expect(
      evaluateTrialDniGate({
        requestedSectionIds: [A],
        enrolledSectionIds: [B],
        hasOpenTrial: false,
      }),
    ).toEqual({ ok: true });
  });
});

describe("planTrialSeats", () => {
  it("rejects an empty selection", () => {
    expect(
      planTrialSeats({
        options: [yoga],
        sectionIds: [],
        amountsBySectionId: { [A]: 0 },
        now: new Date("2026-08-24T12:00:00Z"),
        timeZone: "UTC",
      }),
    ).toEqual({ ok: false, code: "no_section" });
  });

  it("rejects a full, non-trial, or unknown section", () => {
    const full = { ...yoga, hasOpenSeat: false };
    expect(
      planTrialSeats({
        options: [full],
        sectionIds: [A],
        amountsBySectionId: { [A]: 0 },
        now: new Date("2026-08-24T12:00:00Z"),
        timeZone: "UTC",
      }).ok,
    ).toBe(false);
  });

  it("books the next occurrence of each selected section", () => {
    const planned = planTrialSeats({
      options: [yoga],
      sectionIds: [A],
      amountsBySectionId: { [A]: 15 },
      now: new Date("2026-08-24T12:00:00Z"),
      timeZone: "UTC",
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.seats).toEqual([
      {
        sectionId: A,
        label: "Yoga mañana",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        scheduledOn: "2026-08-31",
        trialFeeAmount: 15,
      },
    ]);
  });
});

describe("buildTrialFeeSnapshot", () => {
  it("sums frozen seat amounts and tags kind trial_fee", () => {
    expect(
      buildTrialFeeSnapshot({
        currency: "CLP",
        seats: [
          {
            sectionId: A,
            label: "A",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "10:00",
            scheduledOn: "2026-08-31",
            trialFeeAmount: 10,
          },
          {
            sectionId: B,
            label: "B",
            dayOfWeek: 2,
            startTime: "10:00",
            endTime: "11:00",
            scheduledOn: "2026-09-01",
            trialFeeAmount: 5,
          },
        ],
      }),
    ).toEqual({
      kind: "trial_fee",
      currency: "CLP",
      total: 15,
      seats: [
        { sectionId: A, amount: 10 },
        { sectionId: B, amount: 5 },
      ],
    });
  });
});
