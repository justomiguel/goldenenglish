/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendRetentionContactEmailAction } from "@/app/[locale]/dashboard/admin/academic/retentionEmailActions";

const COH = "00000000-0000-4000-8000-000000000020";
const STU = "00000000-0000-4000-8000-000000000030";
const ENR = "00000000-0000-4000-8000-000000000040";
const TUT = "00000000-0000-4000-8000-000000000050";
const SEC = "00000000-0000-4000-8000-000000000060";

const ADM = "00000000-0000-4000-8000-0000000000ad";
const { mockAssertAdmin, userRpc, sendBrandedEmail, recordSystemAudit, revalidatePath, createAdminClient, notifyRetentionOutreachInApp, getEmailProvider } =
  vi.hoisted(() => ({
    mockAssertAdmin: vi.fn(),
    userRpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    sendBrandedEmail: vi.fn(),
    recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
    revalidatePath: vi.fn(),
    createAdminClient: vi.fn(),
    notifyRetentionOutreachInApp: vi.fn().mockResolvedValue(undefined),
    getEmailProvider: vi.fn(() => ({})),
  }));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail,
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandPublic: () => ({ name: "Test Institute" }),
}));

vi.mock("@/lib/messaging/notifyRetentionOutreachInApp", () => ({
  notifyRetentionOutreachInApp,
}));

vi.mock("@/lib/email/getEmailProvider", () => ({
  getEmailProvider,
}));

vi.mock("@/lib/i18n/dictionaries", () => ({
    getDictionary: async () => ({
    dashboard: {
      adminRetention: {
        emailIntro: "We are following up on retention.",
        outreachInAppWhatsapp: "<p>{student}</p>",
        outreachInAppEmail: "<p>{student}</p>",
      },
    },
  }),
}));

const baseInput = {
  locale: "en" as const,
  cohortId: COH,
  studentId: STU,
  enrollmentId: ENR,
  mailUserId: TUT,
  isSelfContact: false,
  studentLabel: "Ana López",
  sectionName: "Section A",
  signals: "Absences: 2",
  guardianLabel: "María T.",
};

function buildAdminClient(
  opts: {
    enroll?: unknown;
    section?: unknown;
    /** `null` = no tutor–student row */
    tutorLinkRow?: unknown | null;
    email?: string | null;
  } = {},
) {
  const enroll = opts.enroll ?? {
    id: ENR,
    student_id: STU,
    section_id: SEC,
    status: "active",
  };
  const section = opts.section ?? { id: SEC, cohort_id: COH, name: "Section A" };
  const tutorLinkRow = opts.tutorLinkRow === undefined ? { tutor_id: TUT } : opts.tutorLinkRow;
  const email = opts.email === undefined ? "guardian@example.com" : opts.email;
  return {
    from: (table: string) => {
      if (table === "section_enrollments") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: enroll, error: null }),
            }),
          }),
        };
      }
      if (table === "academic_sections") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: section, error: null }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { is_minor: false }, error: null }),
            }),
          }),
        };
      }
      if (table === "tutor_student_rel") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: tutorLinkRow, error: null }),
              }),
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user: email ? { email } : null },
          error: null,
        }),
      },
    },
  };
}

describe("sendRetentionContactEmailAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendBrandedEmail.mockResolvedValue({ ok: true, fromOverride: false });
    userRpc.mockResolvedValue({ data: null, error: null });
    mockAssertAdmin.mockResolvedValue({ supabase: { rpc: userRpc }, user: { id: ADM } });
    createAdminClient.mockReturnValue(buildAdminClient());
  });

  it("rejects invalid input with PARSE", async () => {
    const res = await sendRetentionContactEmailAction({ ...baseInput, studentId: "x" });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("sends branded email, audits, and revalidates the cohort page", async () => {
    const res = await sendRetentionContactEmailAction(baseInput);
    expect(res).toEqual({ ok: true });
    expect(sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guardian@example.com",
        templateKey: "academics.retention_contact",
        locale: "en",
        vars: expect.objectContaining({
          brandName: "Test Institute",
          studentLabel: "Ana López",
          sectionName: "Section A",
          signals: "Absences: 2",
        }),
      }),
    );
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "retention_contact_email_sent",
        resourceType: "section_enrollment",
        resourceId: ENR,
        payload: expect.objectContaining({
          cohort_id: COH,
          student_id: STU,
          mail_user_id: TUT,
          is_self: false,
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/en/dashboard/admin/academic/${COH}`, "page");
    expect(userRpc).toHaveBeenCalledWith("increment_enrollment_retention_contact", {
      p_enrollment_id: ENR,
      p_channel: "email",
    });
    expect(notifyRetentionOutreachInApp).toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the enrollment student does not match", async () => {
    createAdminClient.mockReturnValue(
      buildAdminClient({
        enroll: {
          id: ENR,
          student_id: "00000000-0000-4000-8000-000000000099",
          section_id: SEC,
          status: "active",
        },
      }),
    );
    const res = await sendRetentionContactEmailAction(baseInput);
    expect(res).toEqual({ ok: false, code: "NOT_FOUND" });
  });

  it("returns NO_LINK when the tutor is not linked to the student", async () => {
    createAdminClient.mockReturnValue(buildAdminClient({ tutorLinkRow: null }));
    const res = await sendRetentionContactEmailAction(baseInput);
    expect(res).toEqual({ ok: false, code: "NO_LINK" });
  });

  it("returns NO_EMAIL when the tutor has no auth email", async () => {
    createAdminClient.mockReturnValue(
      buildAdminClient({
        email: null,
      }),
    );
    const res = await sendRetentionContactEmailAction(baseInput);
    expect(res).toEqual({ ok: false, code: "NO_EMAIL" });
  });

  it("returns FORBIDDEN when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("nope"));
    const res = await sendRetentionContactEmailAction(baseInput);
    expect(res).toEqual({ ok: false, code: "FORBIDDEN" });
  });

  it("sends to the student when isSelfContact (no tutor links, adult)", async () => {
    const selfInput = {
      ...baseInput,
      mailUserId: STU,
      isSelfContact: true,
      guardianLabel: "Ana López",
    };
    const client = buildAdminClient({ email: "student@example.com" });
    createAdminClient.mockReturnValue({
      ...client,
      auth: {
        admin: {
          getUserById: async (id: string) => ({
            data: { user: id === STU ? { email: "student@example.com" } : null },
            error: null,
          }),
        },
      },
    });
    const res = await sendRetentionContactEmailAction(selfInput);
    expect(res).toEqual({ ok: true });
    expect(sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@example.com",
        templateKey: "academics.retention_contact",
      }),
    );
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          mail_user_id: STU,
          is_self: true,
        }),
      }),
    );
  });

  it("rejects isSelfContact when mailUserId is not the student", async () => {
    const res = await sendRetentionContactEmailAction({
      ...baseInput,
      isSelfContact: true,
      mailUserId: TUT,
    });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("returns EMAIL_FAILED with provider message when sendBrandedEmail fails", async () => {
    sendBrandedEmail.mockResolvedValueOnce({ ok: false, error: "domain not verified" });
    const res = await sendRetentionContactEmailAction(baseInput);
    expect(res).toEqual({
      ok: false,
      code: "EMAIL_FAILED",
      message: "domain not verified",
    });
    expect(userRpc).not.toHaveBeenCalled();
  });
});
