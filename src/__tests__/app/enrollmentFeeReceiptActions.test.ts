/** @vitest-environment node */
// REGRESSION CHECK: These tests fix the contract that:
// - students and parents can upload enrollment fee receipts (stored in section_enrollments)
// - receipts are rejected when already approved or when student is exempt
// - the path always starts with {studentId}/ so RLS on payment-receipts bucket passes
// - admin can approve/reject receipts via reviewEnrollmentFeeReceipt
import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import { submitEnrollmentFeeReceipt } from "@/app/[locale]/dashboard/student/payments/submitEnrollmentFeeReceiptAction";
import { submitTutorEnrollmentFeeReceipt } from "@/app/[locale]/dashboard/parent/payments/actions";
import { reviewEnrollmentFeeReceipt } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/enrollmentFeeActions";

const PE = es.actionErrors.payment;
const B = es.actionErrors.billingStudent;

const studentId = "00000000-0000-4000-8000-000000000001";
const sectionId = "00000000-0000-4000-8000-000000000002";
const enrollmentId = "00000000-0000-4000-8000-000000000003";

// ---- Supabase factory helpers ----

type FakeEnrollment = {
  id: string;
  enrollment_fee_exempt?: boolean;
  enrollment_fee_receipt_status?: string | null;
};

function fakeUser(id = studentId) {
  return { data: { user: { id } }, error: null };
}

function makeUploadResult(error: null | { message: string } = null) {
  return { error };
}

function makeSupabase({
  role = "student",
  enrollment = {
    id: enrollmentId,
    enrollment_fee_exempt: false,
    enrollment_fee_receipt_status: null,
  } as FakeEnrollment | null,
  updateError = null as null | { message: string },
  uploadError = null as null | { message: string },
  profilesErr = null as null | { message: string },
} = {}) {
  const uploadFn = vi.fn().mockResolvedValue(makeUploadResult(uploadError));
  const storageBucket = { upload: uploadFn };
  const storage = { from: vi.fn(() => storageBucket) };

  const updateChain = {
    eq: vi.fn().mockReturnThis(),
    then: (resolve: (v: { error: typeof updateError }) => void) =>
      resolve({ error: updateError }),
  };

  const enrollmentChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn(() => updateChain),
    maybeSingle: vi.fn().mockResolvedValue({ data: enrollment, error: null }),
  };

  const profileChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: profilesErr ? null : { role },
      error: profilesErr,
    }),
  };

  const from = vi.fn((table: string) => {
    if (table === "profiles") return profileChain;
    if (table === "section_enrollments") return enrollmentChain;
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
  });

  return { auth: { getUser: vi.fn().mockResolvedValue(fakeUser()) }, from, storage };
}

// ---- Mocks ----

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("@/lib/profile/getProfilePermissions", () => ({
  getProfilePermissions: vi.fn().mockResolvedValue({ canAccessPaymentsModule: true }),
}));

const mockResolveTutorLink = vi.fn();
vi.mock("@/lib/auth/resolveTutorStudentLink", () => ({
  resolveTutorStudentLink: (...args: unknown[]) => mockResolveTutorLink(...args),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling", () => ({
  revalidateStudentBillingPaths: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logSupabaseClientError: vi.fn(),
  logServerAuthzDenied: vi.fn(),
}));

function makeFile(name = "receipt.jpg", type = "image/jpeg", sizeBytes = 100): File {
  const buf = new Uint8Array(sizeBytes).fill(65);
  return new File([buf], name, { type });
}

function makeFormData(overrides: Record<string, string | File> = {}) {
  const fd = new FormData();
  fd.append("locale", "es");
  fd.append("sectionId", sectionId);
  fd.append("receipt", makeFile());
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v as string);
  }
  return fd;
}

// ===== Student action =====

describe("submitEnrollmentFeeReceipt", () => {
  beforeEach(() => {
    mockCreateClient.mockReturnValue(makeSupabase());
  });

  it("returns error when sectionId is missing", async () => {
    const fd = makeFormData();
    fd.delete("sectionId");
    const res = await submitEnrollmentFeeReceipt(fd);
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.invalidForm);
  });

  it("returns error when no file is attached", async () => {
    const fd = makeFormData();
    fd.delete("receipt");
    const res = await submitEnrollmentFeeReceipt(fd);
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.receiptRequired);
  });

  it("returns error when file mime is invalid", async () => {
    const fd = makeFormData({ receipt: makeFile("doc.txt", "text/plain") });
    const res = await submitEnrollmentFeeReceipt(fd);
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.mimeInvalid);
  });

  it("returns error when student is exempt", async () => {
    mockCreateClient.mockReturnValue(
      makeSupabase({ enrollment: { id: enrollmentId, enrollment_fee_exempt: true } }),
    );
    const res = await submitEnrollmentFeeReceipt(makeFormData());
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.enrollmentFeeExempt);
  });

  it("returns error when receipt is already approved", async () => {
    mockCreateClient.mockReturnValue(
      makeSupabase({
        enrollment: {
          id: enrollmentId,
          enrollment_fee_exempt: false,
          enrollment_fee_receipt_status: "approved",
        },
      }),
    );
    const res = await submitEnrollmentFeeReceipt(makeFormData());
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.enrollmentAlreadyApproved);
  });

  it("returns error when enrollment not found", async () => {
    mockCreateClient.mockReturnValue(makeSupabase({ enrollment: null }));
    const res = await submitEnrollmentFeeReceipt(makeFormData());
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.enrollmentNotFound);
  });

  it("returns error when storage upload fails", async () => {
    mockCreateClient.mockReturnValue(makeSupabase({ uploadError: { message: "fail" } }));
    const res = await submitEnrollmentFeeReceipt(makeFormData());
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.uploadFailed);
  });

  it("returns ok and sets pending status on success", async () => {
    const supabase = makeSupabase();
    mockCreateClient.mockReturnValue(supabase);
    const res = await submitEnrollmentFeeReceipt(makeFormData());
    expect(res.ok).toBe(true);
    // storage path must start with studentId/
    const uploadCall = supabase.storage.from.mock.results[0].value.upload.mock.calls[0];
    expect(uploadCall[0]).toMatch(new RegExp(`^${studentId}/enrollment-fee/`));
  });

  it("returns error when user is not a student", async () => {
    mockCreateClient.mockReturnValue(makeSupabase({ role: "parent" }));
    const res = await submitEnrollmentFeeReceipt(makeFormData());
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.forbidden);
  });
});

// ===== Parent/tutor action =====

describe("submitTutorEnrollmentFeeReceipt", () => {
  const parentId = "00000000-0000-4000-8000-000000000099";

  function makeParentSupabase(opts: Parameters<typeof makeSupabase>[0] = {}) {
    const base = makeSupabase({ role: "parent", ...opts });
    base.auth.getUser = vi.fn().mockResolvedValue(fakeUser(parentId));
    return base;
  }

  beforeEach(() => {
    mockCreateClient.mockReturnValue(makeParentSupabase());
    mockResolveTutorLink.mockResolvedValue({ linked: true, financialAccessActive: true });
  });

  function makeParentFormData(overrides: Record<string, string | File> = {}) {
    const fd = makeFormData(overrides);
    fd.append("studentId", studentId);
    return fd;
  }

  it("returns error when studentId is missing", async () => {
    const fd = makeFormData(); // no studentId
    const res = await submitTutorEnrollmentFeeReceipt(fd);
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.invalidForm);
  });

  it("returns error when student is not linked", async () => {
    mockResolveTutorLink.mockResolvedValue({ linked: false, financialAccessActive: false });
    const res = await submitTutorEnrollmentFeeReceipt(makeParentFormData());
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.studentNotLinked);
  });

  it("returns error when financial access is revoked", async () => {
    mockResolveTutorLink.mockResolvedValue({ linked: true, financialAccessActive: false });
    const res = await submitTutorEnrollmentFeeReceipt(makeParentFormData());
    expect(res.ok).toBe(false);
    expect(res.message).toBe(PE.forbidden);
  });

  it("returns ok when tutor uploads a valid receipt", async () => {
    mockCreateClient.mockReturnValue(makeParentSupabase());
    const res = await submitTutorEnrollmentFeeReceipt(makeParentFormData());
    expect(res.ok).toBe(true);
  });
});

// ===== Admin action =====

describe("reviewEnrollmentFeeReceipt", () => {
  function makeAdminSupabase(updateError: null | { message: string } = null) {
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (v: { error: typeof updateError }) => void) =>
        resolve({ error: updateError }),
    };
    const seChain = { update: vi.fn(() => updateChain) };
    return {
      from: vi.fn((t: string) => {
        if (t === "section_enrollments") return seChain;
        return {};
      }),
    };
  }

  beforeEach(() => {
    mockAssertAdmin.mockResolvedValue({
      supabase: makeAdminSupabase(),
      user: { id: "admin-1" },
    });
  });

  it("rejects invalid studentId UUID", async () => {
    const res = await reviewEnrollmentFeeReceipt({
      locale: "es",
      studentId: "not-a-uuid",
      enrollmentId,
      decision: "approved",
    });
    expect(res.ok).toBe(false);
    expect(res.message).toBe(B.invalidData);
  });

  it("rejects invalid enrollmentId UUID", async () => {
    const res = await reviewEnrollmentFeeReceipt({
      locale: "es",
      studentId,
      enrollmentId: "bad",
      decision: "approved",
    });
    expect(res.ok).toBe(false);
    expect(res.message).toBe(B.invalidData);
  });

  it("returns ok when approving a receipt", async () => {
    const res = await reviewEnrollmentFeeReceipt({
      locale: "es",
      studentId,
      enrollmentId,
      decision: "approved",
    });
    expect(res.ok).toBe(true);
  });

  it("returns ok when rejecting a receipt", async () => {
    const res = await reviewEnrollmentFeeReceipt({
      locale: "es",
      studentId,
      enrollmentId,
      decision: "rejected",
    });
    expect(res.ok).toBe(true);
  });

  it("returns error when db update fails", async () => {
    mockAssertAdmin.mockResolvedValue({
      supabase: makeAdminSupabase({ message: "db error" }),
      user: { id: "admin-1" },
    });
    const res = await reviewEnrollmentFeeReceipt({
      locale: "es",
      studentId,
      enrollmentId,
      decision: "approved",
    });
    expect(res.ok).toBe(false);
    expect(res.message).toBe(B.saveFailed);
  });
});
