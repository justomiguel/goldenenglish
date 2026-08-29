/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { markTrialSeatAttendance } from "@/lib/register/markTrialSeatAttendance";
import esDict from "@/dictionaries/es.json";

const SEAT = "11111111-1111-4111-8111-111111111111";
const LEAD = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const { notifyInvite, notifyMissed } = vi.hoisted(() => ({
  notifyInvite: vi.fn(),
  notifyMissed: vi.fn(),
}));

vi.mock("@/lib/register/notifyTrialSeatMails", () => ({
  familyEmailForTrialLead: () => "tutor@test.com",
  notifyTrialSeatInvite: (...args: unknown[]) => notifyInvite(...args),
  notifyTrialSeatMissed: (...args: unknown[]) => notifyMissed(...args),
}));

vi.mock("@/lib/register/generateRegistrationPayToken", () => ({
  generateRegistrationPayToken: () => "token-1",
}));

function seatRow(status: string, extras: Record<string, unknown> = {}) {
  return {
    id: SEAT,
    status,
    scheduled_on: "2026-08-31",
    start_time: "12:00:00",
    end_time: "13:00:00",
    section_id: "sec-1",
    missed_mail_sent_at: extras.missed_mail_sent_at ?? null,
    registration: {
      id: LEAD,
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@test.com",
      tutor_name: "Ann",
      tutor_email: "tutor@test.com",
      birth_date: "2000-01-01",
      trial_convert_token: extras.trial_convert_token ?? null,
      trial_reschedule_token: extras.trial_reschedule_token ?? null,
      status: "new",
    },
    section: { name: "Yoga mañana" },
  };
}

function adminClient(opts: {
  seat?: ReturnType<typeof seatRow> | null;
  updates?: Array<{ table: string; patch: Record<string, unknown> }>;
}) {
  const updates = opts.updates ?? [];
  return {
    from: vi.fn((table: string) => {
      if (table === "registration_trial_seats") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: opts.seat ?? null,
                error: null,
              }),
            }),
          }),
          update: vi.fn((patch: Record<string, unknown>) => {
            updates.push({ table, patch });
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }
      if (table === "registrations") {
        return {
          update: vi.fn((patch: Record<string, unknown>) => {
            updates.push({ table, patch });
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    }),
  };
}

describe("markTrialSeatAttendance", () => {
  beforeEach(() => {
    notifyInvite.mockReset();
    notifyMissed.mockReset();
  });

  it("marks present, mints convert token, and sends invite once", async () => {
    const updates: Array<{ table: string; patch: Record<string, unknown> }> = [];
    const result = await markTrialSeatAttendance({
      admin: adminClient({ seat: seatRow("booked"), updates }) as never,
      seatId: SEAT,
      mark: "present",
      markedBy: "teacher-1",
      locale: "es",
      dict: esDict,
      now: new Date("2026-08-31T15:00:00.000Z"),
    });
    expect(result).toEqual({ ok: true });
    expect(updates.find((u) => u.table === "registration_trial_seats")?.patch.status).toBe(
      "attended",
    );
    expect(updates.find((u) => u.table === "registrations")?.patch.trial_convert_token).toBe(
      "token-1",
    );
    expect(notifyInvite).toHaveBeenCalledTimes(1);
    expect(notifyMissed).not.toHaveBeenCalled();
  });

  it("does not send a second invite when already attended", async () => {
    const result = await markTrialSeatAttendance({
      admin: adminClient({
        seat: seatRow("attended", { trial_convert_token: "existing" }),
      }) as never,
      seatId: SEAT,
      mark: "present",
      markedBy: "teacher-1",
      locale: "es",
      dict: esDict,
    });
    expect(result).toEqual({ ok: false, code: "noop" });
    expect(notifyInvite).not.toHaveBeenCalled();
  });

  it("marks late present from absent and still invites", async () => {
    const result = await markTrialSeatAttendance({
      admin: adminClient({
        seat: seatRow("absent", { missed_mail_sent_at: "2026-09-01T03:00:00.000Z" }),
      }) as never,
      seatId: SEAT,
      mark: "present",
      markedBy: "admin-1",
      locale: "es",
      dict: esDict,
    });
    expect(result).toEqual({ ok: true });
    expect(notifyInvite).toHaveBeenCalledTimes(1);
  });

  it("marks absent, mints reschedule token, and sends missed-you once", async () => {
    const updates: Array<{ table: string; patch: Record<string, unknown> }> = [];
    const result = await markTrialSeatAttendance({
      admin: adminClient({ seat: seatRow("booked"), updates }) as never,
      seatId: SEAT,
      mark: "absent",
      markedBy: null,
      locale: "es",
      dict: esDict,
    });
    expect(result).toEqual({ ok: true });
    expect(updates.find((u) => u.table === "registration_trial_seats")?.patch.status).toBe(
      "absent",
    );
    expect(updates.find((u) => u.table === "registrations")?.patch.trial_reschedule_token).toBe(
      "token-1",
    );
    expect(notifyMissed).toHaveBeenCalledTimes(1);
    expect(notifyInvite).not.toHaveBeenCalled();
  });
});
