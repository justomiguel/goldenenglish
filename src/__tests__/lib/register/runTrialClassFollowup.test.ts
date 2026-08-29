/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runTrialClassFollowup } from "@/lib/register/runTrialClassFollowup";

const { markSeat, notifyAdmin, getDict } = vi.hoisted(() => ({
  markSeat: vi.fn(),
  notifyAdmin: vi.fn(),
  getDict: vi.fn(),
}));

vi.mock("@/lib/datetime/instituteTimeZone", () => ({
  getInstituteTimeZone: () => "America/Argentina/Buenos_Aires",
}));

vi.mock("@/lib/i18n/dictionaries", () => ({
  defaultLocale: "es",
  getDictionary: () => getDict(),
}));

vi.mock("@/lib/register/markTrialSeatAttendance", () => ({
  markTrialSeatAttendance: (...args: unknown[]) => markSeat(...args),
}));

vi.mock("@/lib/register/notifyTrialSeatMails", () => ({
  notifyTrialAdminAttendanceDue: (...args: unknown[]) => notifyAdmin(...args),
}));

function adminClient(opts: {
  booked?: unknown[];
  stale?: unknown[];
  expired?: unknown[];
  released?: unknown[];
  bookedErr?: { message: string };
  staleErr?: { message: string };
  expiredErr?: { message: string };
  releaseErr?: { message: string };
  reminderUpdateErr?: { message: string };
}) {
  return {
    from: vi.fn((table: string) => {
      if (table === "registration_trial_seats") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: opts.booked ?? [],
                error: opts.bookedErr ?? null,
              }),
              lt: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: opts.stale ?? [],
                  error: opts.staleErr ?? null,
                }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ error: opts.reminderUpdateErr ?? null }),
            }),
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: opts.released ?? [],
                  error: opts.releaseErr ?? null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "registrations") {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              lt: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: opts.expired ?? [],
                    error: opts.expiredErr ?? null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    }),
  };
}

describe("runTrialClassFollowup", () => {
  beforeEach(() => {
    markSeat.mockReset().mockResolvedValue({ ok: true });
    notifyAdmin.mockReset().mockResolvedValue(undefined);
    getDict.mockResolvedValue({});
  });

  it("reminds admins, auto-absents stale booked seats, and releases expired holds", async () => {
    const now = new Date("2026-08-31T14:30:00.000Z");
    const result = await runTrialClassFollowup(
      adminClient({
        booked: [
          {
            id: "due",
            scheduled_on: "2026-08-31",
            start_time: "12:00",
            admin_reminder_sent_at: null,
            registration: { first_name: "Ada", last_name: "Lovelace" },
            section: { name: "Yoga" },
          },
        ],
        stale: [{ id: "stale-1" }],
        expired: [{ id: "lead-1" }],
        released: [{ id: "rel-1" }],
      }) as never,
      now,
    );
    expect(notifyAdmin).toHaveBeenCalledTimes(1);
    expect(markSeat).toHaveBeenCalledWith(
      expect.objectContaining({ seatId: "stale-1", mark: "absent", markedBy: null }),
    );
    expect(result).toEqual({ reminders: 1, absents: 1, released: 1 });
  });

  it("skips already-reminded seats and uses array embeds plus dash fallbacks", async () => {
    const now = new Date("2026-08-31T14:30:00.000Z");
    await runTrialClassFollowup(
      adminClient({
        booked: [
          {
            id: "already",
            scheduled_on: "2026-08-31",
            start_time: "12:00",
            admin_reminder_sent_at: "2026-08-31T10:00:00.000Z",
            registration: { first_name: "Ada", last_name: "Lovelace" },
            section: { name: "Yoga" },
          },
          {
            id: "due-array",
            scheduled_on: "2026-08-31",
            start_time: "12:00",
            admin_reminder_sent_at: null,
            registration: [],
            section: [{ name: "  " }],
          },
        ],
      }) as never,
      now,
    );
    expect(notifyAdmin).toHaveBeenCalledTimes(1);
    expect(notifyAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ studentName: "—", sectionName: "—" }),
    );
  });

  it("logs query errors and does not mark seats", async () => {
    const now = new Date("2026-08-31T14:30:00.000Z");
    const result = await runTrialClassFollowup(
      adminClient({
        bookedErr: { message: "booked_down" },
        staleErr: { message: "stale_down" },
        expiredErr: { message: "expired_down" },
      }) as never,
      now,
    );
    expect(notifyAdmin).not.toHaveBeenCalled();
    expect(markSeat).not.toHaveBeenCalled();
    expect(result).toEqual({ reminders: 0, absents: 0, released: 0 });
  });

  it("does not count a reminder when the stamp update fails", async () => {
    const now = new Date("2026-08-31T14:30:00.000Z");
    const result = await runTrialClassFollowup(
      adminClient({
        booked: [
          {
            id: "due",
            scheduled_on: "2026-08-31",
            start_time: "12:00",
            admin_reminder_sent_at: null,
            registration: { first_name: "Ada", last_name: "Lovelace" },
            section: { name: "Yoga" },
          },
        ],
        reminderUpdateErr: { message: "stamp_failed" },
      }) as never,
      now,
    );
    expect(notifyAdmin).toHaveBeenCalledTimes(1);
    expect(result.reminders).toBe(0);
  });

  it("swallows reminder and absent exceptions and a failed mark", async () => {
    notifyAdmin.mockRejectedValueOnce(new Error("mail_down"));
    markSeat.mockResolvedValueOnce({ ok: false }).mockRejectedValueOnce(new Error("mark_down"));
    const now = new Date("2026-08-31T14:30:00.000Z");
    const result = await runTrialClassFollowup(
      adminClient({
        booked: [
          {
            id: "due",
            scheduled_on: "2026-08-31",
            start_time: "12:00",
            admin_reminder_sent_at: null,
            registration: { first_name: "Ada", last_name: "Lovelace" },
            section: { name: "Yoga" },
          },
        ],
        stale: [{ id: "stale-1" }, { id: "stale-2" }],
      }) as never,
      now,
    );
    expect(result.reminders).toBe(0);
    expect(result.absents).toBe(0);
  });

  it("leaves holds when convert expiry has no rows or release fails", async () => {
    const now = new Date("2026-08-31T14:30:00.000Z");
    const empty = await runTrialClassFollowup(adminClient({ expired: [] }) as never, now);
    expect(empty.released).toBe(0);
    const failed = await runTrialClassFollowup(
      adminClient({
        expired: [{ id: "lead-1" }],
        releaseErr: { message: "rel_down" },
      }) as never,
      now,
    );
    expect(failed.released).toBe(0);
  });
});
