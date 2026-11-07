/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  enroll: vi.fn(),
  join: vi.fn(),
}));

vi.mock("@/lib/register/enrollRequestedSectionsOnAccept", () => ({
  enrollRequestedSectionsOnAccept: (...args: unknown[]) => mocks.enroll(...args),
}));
vi.mock("@/lib/register/packs/nago/applyNagoExtrasOnAccept", () => ({
  applyNagoExtrasOnAccept: vi.fn(async () => undefined),
  nagoCareLabelsFromRegisterDict: () => ({}),
}));
vi.mock("@/lib/billing/runJoinBillingDisposition", () => ({
  runJoinBillingDisposition: (...args: unknown[]) => mocks.join(...args),
}));
vi.mock("@/lib/audit/domainAudit", () => ({
  auditFinanceAction: (...args: unknown[]) => mocks.audit(...args),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn(async () => undefined),
}));
vi.mock("@/lib/email/registrationIntakeEmails", () => ({
  notifyRegistrationWelcome: vi.fn(async () => undefined),
}));
vi.mock("@/lib/email/notifyAdminsRegistrationPlacement", () => ({
  notifyAdminsRegistrationPlacement: vi.fn(async () => undefined),
}));

import { finalizeAcceptedRegistrationLead } from "@/lib/register/finalizeAcceptedRegistrationLead";

const SECTION = "11111111-1111-4111-8111-111111111111";

function admin() {
  const updates: unknown[] = [];
  function query() {
    const q = {
      update: (values: unknown) => {
        updates.push(values);
        return q;
      },
      eq: () => q,
      in: () => q,
      then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
    };
    return q;
  }
  return { client: { from: () => query() }, updates };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.enroll.mockResolvedValue([]);
  mocks.join.mockResolvedValue({ ok: true });
  mocks.audit.mockResolvedValue({ ok: true });
});

describe("finalizeAcceptedRegistrationLead", () => {
  it("writes the enrollment fee method, amount, and date", async () => {
    const db = admin();
    const result = await finalizeAcceptedRegistrationLead({
      admin: db.client as never,
      enrollClient: db.client as never,
      locale: "es",
      dict: { register: { enrollmentPayUndecidedSection: "horario", nagoPack: {} } } as never,
      registration: {
        id: "reg-1",
        preferred_section_id: SECTION,
        additional_section_ids: [],
        tenant_extras: null,
        fee_snapshot: null,
        first_name: "Ana",
        last_name: "Pérez",
        email: "ana@example.com",
        tutor_name: null,
        tutor_email: null,
      },
      studentId: "stu-1",
      reuseStudent: true,
      isMinor: false,
      courseId: null,
      applicantUndecided: false,
      paidCapture: true,
      feePayment: { method: "cash", amount: 15000, paidOn: "2026-11-06" },
      skipFamilyWelcome: true,
      joinDisposition: { kind: "behind" },
      actorId: "admin-1",
    });
    expect(result.ok).toBe(true);
    expect(db.updates[0]).toMatchObject({
      enrollment_fee_paid_method: "cash",
      enrollment_fee_paid_amount: 15000,
      enrollment_fee_paid_on: "2026-11-06",
    });
  });
});
