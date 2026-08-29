/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { attachTrialSeatsToRegistrationRows } from "@/lib/register/attachTrialSeatsToRegistrationRows";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

function row(partial: Partial<AdminRegistrationRow> & { id: string }): AdminRegistrationRow {
  return {
    first_name: "A",
    last_name: "B",
    dni: "1",
    email: "a@x.co",
    phone: null,
    birth_date: null,
    level_interest: null,
    status: "new",
    created_at: null,
    tutor_name: null,
    tutor_dni: null,
    tutor_email: null,
    tutor_phone: null,
    tutor_relationship: null,
    preferred_section_id: null,
    additionalSectionIds: [],
    existingStudentId: null,
    contacted_at: null,
    contacted_by: null,
    sourceSectionLinkId: null,
    intent: "reserve",
    ...partial,
  };
}

describe("attachTrialSeatsToRegistrationRows", () => {
  it("skips the seats query when no trial leads are on the page", async () => {
    const from = vi.fn();
    const result = await attachTrialSeatsToRegistrationRows(
      { from } as never,
      [row({ id: "r1", intent: "reserve" })],
    );
    expect(from).not.toHaveBeenCalled();
    expect(result[0]?.trialSeats).toBeUndefined();
  });

  it("attaches booked seats to trial leads", async () => {
    const from = vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: "seat-1",
                registration_id: "t1",
                section_id: "s1",
                scheduled_on: "2026-08-31",
                start_time: "09:00:00",
                end_time: "10:00:00",
                status: "booked",
              },
            ],
            error: null,
          }),
        }),
      }),
    }));
    const result = await attachTrialSeatsToRegistrationRows({ from } as never, [
      row({ id: "t1", intent: "trial" }),
      row({ id: "r1", intent: "reserve" }),
    ]);
    expect(result[0]?.trialSeats).toEqual([
      {
        id: "seat-1",
        sectionId: "s1",
        scheduledOn: "2026-08-31",
        startTime: "09:00",
        endTime: "10:00",
        status: "booked",
      },
    ]);
    expect(result[1]?.trialSeats).toBeUndefined();
  });
});
