/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: async () => ({
    supabase: mocks.supabase,
    user: { id: "admin-1" },
  }),
}));
vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: async () => ({
    actionErrors: {
      billingStudent: {
        invalidStudent: "invalid",
        invalidData: "invalid",
        notAStudent: "not",
        saveFailed: "save",
        forbidden: "forbidden",
      },
    },
  }),
}));
vi.mock("@/lib/audit/domainAudit", () => ({
  auditFinanceAction: (...args: unknown[]) => mocks.audit(...args),
}));
vi.mock("@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling", () => ({
  revalidateStudentBillingPaths: vi.fn(),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { markEnrollmentFeePaidNow } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/markEnrollmentFeePaidNow";

const STUDENT = "00000000-0000-4000-8000-000000000001";
const SECTION = "00000000-0000-4000-8000-000000000002";

function supabase() {
  const writes: unknown[] = [];
  function query(table: string) {
    const q = {
      select: () => q,
      eq: () => q,
      update: (values: unknown) => {
        writes.push(values);
        return q;
      },
      single: async () => ({ data: { role: "student" }, error: null }),
      maybeSingle: async () =>
        table === "section_enrollments"
          ? {
              data: {
                id: "enr-1",
                last_enrollment_paid_at: null,
                enrollment_fee_paid_method: null,
                enrollment_fee_paid_amount: null,
                enrollment_fee_paid_on: null,
              },
              error: null,
            }
          : { data: { enrollment_fee_amount: 15000 }, error: null },
      then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
    };
    return q;
  }
  return { client: { from: query }, writes };
}

const db = supabase();

beforeEach(() => {
  vi.clearAllMocks();
  db.writes.length = 0;
  Object.assign(mocks, { supabase: db.client });
  mocks.audit.mockResolvedValue({ ok: true });
});

describe("markEnrollmentFeePaidNow", () => {
  it("writes the method, the amount, and the date", async () => {
    const result = await markEnrollmentFeePaidNow({
      locale: "es",
      studentId: STUDENT,
      sectionId: SECTION,
      method: "cash",
      amount: 15000,
      paidOn: "2026-11-06",
    });
    expect(result.ok).toBe(true);
    expect(db.writes[0]).toMatchObject({
      enrollment_fee_paid_method: "cash",
      enrollment_fee_paid_amount: 15000,
      enrollment_fee_paid_on: "2026-11-06",
    });
  });

  it("reverts the write when the finance audit fails", async () => {
    mocks.audit.mockResolvedValue({ ok: false });
    const result = await markEnrollmentFeePaidNow({
      locale: "es",
      studentId: STUDENT,
      sectionId: SECTION,
      method: "cash",
      amount: 15000,
      paidOn: "2026-11-06",
    });
    expect(result.ok).toBe(false);
    expect(db.writes.at(-1)).toMatchObject({
      enrollment_fee_paid_method: null,
      enrollment_fee_paid_amount: null,
      enrollment_fee_paid_on: null,
    });
  });
});
