/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeTrialRegistrationSubmit } from "@/lib/register/completeTrialRegistrationSubmit";
import esDict from "@/dictionaries/es.json";

const SECTION = "11111111-1111-4111-8111-111111111111";
const LEAD = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const { getPublicCtaMode, notifyTrial } = vi.hoisted(() => ({
  getPublicCtaMode: vi.fn(),
  notifyTrial: vi.fn(),
}));

vi.mock("@/lib/settings/getPublicCtaMode", () => ({
  getPublicCtaMode: () => getPublicCtaMode(),
}));

vi.mock("@/lib/datetime/instituteTimeZone", () => ({
  getInstituteTimeZone: () => "UTC",
}));

vi.mock("@/lib/register/notifyTrialRegistrationReceived", () => ({
  notifyTrialRegistrationReceived: (...args: unknown[]) => notifyTrial(...args),
}));

const parsed = {
  first_name: "Ada",
  last_name: "Lovelace",
  dni: "123",
  email: "ada@test.com",
  phone: "+100",
  birth_date: "2000-05-01",
  preferred_section_id: SECTION,
  additional_section_ids: [],
  intent: "trial" as const,
};

function buildClients(opts: {
  picker?: unknown[];
  insertError?: unknown;
  leadId?: string;
  enrolled?: string[];
  openTrial?: boolean;
} = {}) {
  const seatsInsert = vi.fn().mockResolvedValue({ error: null });
  const leadInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: opts.insertError ? null : { id: opts.leadId ?? LEAD },
        error: opts.insertError ?? null,
      }),
    }),
  });
  const supabase = {
    rpc: vi.fn().mockImplementation((fn: string) => {
      if (fn === "list_registration_section_picker_options") {
        return Promise.resolve({
          data: opts.picker ?? [
            {
              id: SECTION,
              label: "Yoga mañana",
              schedule_slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
              has_open_seat: true,
              offers_trial: true,
            },
          ],
          error: null,
        });
      }
      if (fn === "registration_public_section_label") {
        return Promise.resolve({ data: "Yoga mañana", error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    from: vi.fn((table: string) => {
      if (table === "registrations") return { insert: leadInsert };
      throw new Error(`unexpected public table ${table}`);
    }),
  };
  const adminFrom = vi.fn((table: string) => {
    if (table === "registration_trial_seats") return { insert: seatsInsert };
    if (table === "section_enrollments") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: (opts.enrolled ?? []).map((section_id) => ({ section_id })),
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "registrations") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: opts.openTrial
                  ? [{ id: "x", registration_trial_seats: [{ status: "booked" }] }]
                  : [],
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "academic_sections") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              {
                id: SECTION,
                offers_trial: true,
                trial_fee_amount: 0,
                academic_cohorts: { offers_trial: true, trial_fee_amount: 0 },
              },
            ],
            error: null,
          }),
        }),
      };
    }
    if (table === "site_settings") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { value: "CLP" }, error: null }),
          }),
        }),
      };
    }
    throw new Error(`unexpected admin table ${table}`);
  });
  return { supabase, admin: { from: adminFrom }, leadInsert, seatsInsert };
}

describe("completeTrialRegistrationSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublicCtaMode.mockResolvedValue("both");
    notifyTrial.mockResolvedValue(undefined);
  });

  it("rejects trial when the site only offers reserve", async () => {
    getPublicCtaMode.mockResolvedValue("reserve");
    const { supabase, admin } = buildClients();
    const res = await completeTrialRegistrationSubmit({
      locale: "es",
      dict: esDict,
      supabase: supabase as never,
      admin: admin as never,
      parsed,
      identity: { kind: "none" },
      extras: {},
      age: 26,
      legal: 18,
      now: new Date("2026-08-24T12:00:00Z"),
    });
    expect(res).toEqual({ ok: false, message: esDict.register.validationError });
  });

  it("rejects when the person already has an open trial", async () => {
    const { supabase, admin } = buildClients({ openTrial: true });
    const res = await completeTrialRegistrationSubmit({
      locale: "es",
      dict: esDict,
      supabase: supabase as never,
      admin: admin as never,
      parsed,
      identity: { kind: "none" },
      extras: {},
      age: 26,
      legal: 18,
      now: new Date("2026-08-24T12:00:00Z"),
    });
    expect(res).toEqual({ ok: false, message: esDict.register.trial.openTrialExists });
  });

  it("inserts the lead and one booked seat", async () => {
    const { supabase, admin, leadInsert, seatsInsert } = buildClients();
    const res = await completeTrialRegistrationSubmit({
      locale: "es",
      dict: esDict,
      supabase: supabase as never,
      admin: admin as never,
      parsed,
      identity: { kind: "none" },
      extras: {},
      age: 26,
      legal: 18,
      now: new Date("2026-08-24T12:00:00Z"),
    });
    expect(res).toEqual({ ok: true });
    expect(leadInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "trial",
        status: "new",
        preferred_section_id: SECTION,
        trial_fee_snapshot: expect.objectContaining({ kind: "trial_fee", total: 0 }),
      }),
    );
    expect(seatsInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        registration_id: LEAD,
        section_id: SECTION,
        status: "booked",
        scheduled_on: "2026-08-31",
        trial_fee_amount: 0,
      }),
    ]);
    expect(notifyTrial).toHaveBeenCalled();
  });

  it("rejects missing section, already-enrolled students, and minors without a mail tenant", async () => {
    const noSection = await completeTrialRegistrationSubmit({
      locale: "es",
      dict: esDict,
      supabase: buildClients().supabase as never,
      admin: buildClients().admin as never,
      parsed: { ...parsed, preferred_section_id: "", additional_section_ids: [] },
      identity: { kind: "none" },
      extras: {},
      age: 26,
      legal: 18,
    });
    expect(noSection).toEqual({ ok: false, message: esDict.register.trial.needsSection });

    const enrolled = await completeTrialRegistrationSubmit({
      locale: "es",
      dict: esDict,
      supabase: buildClients({ enrolled: [SECTION] }).supabase as never,
      admin: buildClients({ enrolled: [SECTION] }).admin as never,
      parsed,
      identity: { kind: "student", studentId: "stu-1", email: "ada@test.com" },
      extras: {},
      age: 26,
      legal: 18,
      now: new Date("2026-08-24T12:00:00Z"),
    });
    expect(enrolled).toEqual({ ok: false, message: esDict.register.trial.alreadyEnrolled });

    const prev = process.env.MAIL_TENANT;
    delete process.env.MAIL_TENANT;
    const minor = await completeTrialRegistrationSubmit({
      locale: "es",
      dict: esDict,
      supabase: buildClients().supabase as never,
      admin: buildClients().admin as never,
      parsed,
      identity: { kind: "none" },
      extras: {},
      age: 10,
      legal: 18,
      now: new Date("2026-08-24T12:00:00Z"),
    });
    if (prev === undefined) delete process.env.MAIL_TENANT;
    else process.env.MAIL_TENANT = prev;
    expect(minor.ok).toBe(false);
  });
});
