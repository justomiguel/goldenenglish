/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dictEn } from "@/test/dictEn";

const resolveTutorStudentLink = vi.fn();
const resolveStudentPaymentSlot = vi.fn();
const recordUserEventServer = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/auth/resolveTutorStudentLink", () => ({
  resolveTutorStudentLink: (...args: unknown[]) => resolveTutorStudentLink(...args),
}));

vi.mock("@/lib/billing/resolveStudentPaymentSlot", () => ({
  resolveStudentPaymentSlot: (...args: unknown[]) => resolveStudentPaymentSlot(...args),
}));

vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: (...args: unknown[]) => recordUserEventServer(...args),
}));

interface SupaSpec {
  user?: { id: string } | null;
  tutorRole?: string | null;
}

const supabaseRef: { current: unknown } = { current: null };

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(supabaseRef.current),
}));

function buildSupabase(spec: SupaSpec) {
  const updateChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };
  const updateEnd = vi.fn().mockResolvedValue({ error: null });
  updateChain.eq.mockReturnValueOnce({ eq: updateEnd });
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: spec.user ?? null } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: spec.tutorRole === null ? null : { role: spec.tutorRole },
            error: null,
          }),
        };
      }
      if (table === "payments") {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi
              .fn()
              .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    }),
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  };
}

function tutorFd(
  o: Partial<{
    studentId: string;
    sectionId: string;
    month: string;
    year: string;
    amount: string;
    file: File | null;
  }> = {},
) {
  const form = new FormData();
  form.set("locale", "en");
  form.set("studentId", o.studentId ?? "stu-1");
  if (o.sectionId !== undefined) form.set("sectionId", o.sectionId);
  form.set("month", o.month ?? "3");
  form.set("year", o.year ?? "2026");
  form.set("amount", o.amount ?? "100");
  if (o.file === null) {
    /* skip */
  } else if (o.file instanceof File) {
    form.set("receipt", o.file);
  } else {
    form.set(
      "receipt",
      new File([new Uint8Array([1])], "r.pdf", { type: "application/pdf" }),
    );
  }
  return form;
}

const pe = dictEn.actionErrors.payment;

beforeEach(() => {
  vi.clearAllMocks();
  supabaseRef.current = null;
});

describe("submitTutorPaymentReceipt validation", () => {
  it("rejects missing studentId before touching Supabase", async () => {
    const { submitTutorPaymentReceipt } = await import(
      "@/app/[locale]/dashboard/parent/payments/actions"
    );
    const form = tutorFd({ studentId: "" });
    const result = await submitTutorPaymentReceipt(form);
    expect(result).toEqual({ ok: false, message: pe.invalidForm });
  });

  it("rejects non-positive amount", async () => {
    const { submitTutorPaymentReceipt } = await import(
      "@/app/[locale]/dashboard/parent/payments/actions"
    );
    const form = tutorFd({ amount: "0" });
    expect(await submitTutorPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.invalidAmount,
    });
  });

  it("rejects missing file", async () => {
    const { submitTutorPaymentReceipt } = await import(
      "@/app/[locale]/dashboard/parent/payments/actions"
    );
    expect(await submitTutorPaymentReceipt(tutorFd({ file: null }))).toEqual({
      ok: false,
      message: pe.receiptRequired,
    });
  });

  it("rejects oversized file", async () => {
    const { submitTutorPaymentReceipt } = await import(
      "@/app/[locale]/dashboard/parent/payments/actions"
    );
    const big = new Uint8Array(4 * 1024 * 1024 + 1);
    const form = tutorFd({
      file: new File([big], "big.pdf", { type: "application/pdf" }),
    });
    expect(await submitTutorPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.fileTooLarge,
    });
  });
});

describe("submitTutorPaymentReceipt authorization", () => {
  it("rejects unauthenticated callers", async () => {
    supabaseRef.current = buildSupabase({ user: null });
    const { submitTutorPaymentReceipt } = await import(
      "@/app/[locale]/dashboard/parent/payments/actions"
    );
    expect(await submitTutorPaymentReceipt(tutorFd())).toEqual({
      ok: false,
      message: pe.unauthorized,
    });
  });

  it("forbids callers whose profile is not parent", async () => {
    supabaseRef.current = buildSupabase({
      user: { id: "tutor-1" },
      tutorRole: "student",
    });
    const { submitTutorPaymentReceipt } = await import(
      "@/app/[locale]/dashboard/parent/payments/actions"
    );
    expect(await submitTutorPaymentReceipt(tutorFd())).toEqual({
      ok: false,
      message: pe.forbidden,
    });
  });

  it("returns studentNotLinked when no tutor_student_rel row exists", async () => {
    supabaseRef.current = buildSupabase({
      user: { id: "tutor-1" },
      tutorRole: "parent",
    });
    resolveTutorStudentLink.mockResolvedValue({
      linked: false,
      financialAccessActive: false,
    });
    const { submitTutorPaymentReceipt } = await import(
      "@/app/[locale]/dashboard/parent/payments/actions"
    );
    expect(await submitTutorPaymentReceipt(tutorFd())).toEqual({
      ok: false,
      message: pe.studentNotLinked,
    });
  });

  it("returns forbidden when adult student revoked financial access", async () => {
    supabaseRef.current = buildSupabase({
      user: { id: "tutor-1" },
      tutorRole: "parent",
    });
    resolveTutorStudentLink.mockResolvedValue({
      linked: true,
      financialAccessActive: false,
    });
    const { submitTutorPaymentReceipt } = await import(
      "@/app/[locale]/dashboard/parent/payments/actions"
    );
    expect(await submitTutorPaymentReceipt(tutorFd())).toEqual({
      ok: false,
      message: pe.forbidden,
    });
  });

  it("uploads receipt under {studentId}/ and stamps parent_id on success", async () => {
    const supabase = buildSupabase({
      user: { id: "tutor-1" },
      tutorRole: "parent",
    });
    supabaseRef.current = supabase;
    resolveTutorStudentLink.mockResolvedValue({
      linked: true,
      financialAccessActive: true,
    });
    resolveStudentPaymentSlot.mockResolvedValue({
      ok: true,
      payment: { id: "pay-1", status: "pending" },
      effectiveAmount: 100,
    });

    const uploadSpy = vi.fn().mockResolvedValue({ error: null });
    supabase.storage = {
      from: () => ({ upload: uploadSpy }),
    } as unknown as typeof supabase.storage;

    let receivedUpdate: Record<string, unknown> | null = null;
    supabase.from = vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "parent" },
            error: null,
          }),
        };
      }
      if (table === "payments") {
        return {
          update: vi.fn((payload: Record<string, unknown>) => {
            receivedUpdate = payload;
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    }) as typeof supabase.from;

    const { submitTutorPaymentReceipt } = await import(
      "@/app/[locale]/dashboard/parent/payments/actions"
    );
    const form = tutorFd({ studentId: "stu-42", amount: "150" });
    const result = await submitTutorPaymentReceipt(form);

    expect(result).toEqual({ ok: true });
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    const path = uploadSpy.mock.calls[0][0];
    expect(typeof path).toBe("string");
    expect((path as string).startsWith("stu-42/")).toBe(true);
    expect(receivedUpdate).toMatchObject({
      receipt_url: expect.stringMatching(/^stu-42\//),
      parent_id: "tutor-1",
    });
  });
});
