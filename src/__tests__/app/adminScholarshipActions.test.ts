/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import {
  createStudentScholarship,
  deactivateStudentScholarship,
} from "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship";

const B = es.actionErrors.billingStudent;
const mockAssertAdmin = vi.fn();

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock(
  "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling",
  () => ({ revalidateStudentBillingPaths: vi.fn() }),
);

const studentId = "00000000-0000-4000-8000-000000000001";
const sectionId = "00000000-0000-4000-8000-000000000002";
const enrollmentId = "00000000-0000-4000-8000-000000000003";
const scholarshipId = "00000000-0000-4000-8000-000000000004";

function profilesStudent() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: "student" }, error: null }),
  };
}

function enrollmentTable(data: unknown) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  return chain;
}

function scholarshipInsertTable() {
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.single = vi.fn().mockResolvedValue({ data: { id: scholarshipId }, error: null });
  return chain;
}

function scholarshipDeactivateTable(updatedRows: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.select = vi.fn().mockResolvedValue({ data: updatedRows, error: null });
  return chain;
}

const validPayload = {
  locale: "es",
  studentId,
  sectionId,
  discountPercent: 50,
  note: " Beca parcial ",
  validFromYear: 2026,
  validFromMonth: 1,
  validUntilYear: null,
  validUntilMonth: null,
  isActive: true,
};

describe("student scholarship actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a scholarship row for the active section enrollment", async () => {
    const enrollment = enrollmentTable({ id: enrollmentId });
    const scholarships = scholarshipInsertTable();
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") return profilesStudent();
        if (table === "section_enrollments") return enrollment;
        if (table === "section_enrollment_scholarships") return scholarships;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "admin-1" } });

    const res = await createStudentScholarship(validPayload);

    expect(res).toEqual({ ok: true });
    expect(scholarships.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        enrollment_id: enrollmentId,
        section_id: sectionId,
        student_id: studentId,
        discount_percent: 50,
        note: "Beca parcial",
      }),
    );
  });

  it("rejects create when no active enrollment row exists", async () => {
    const enrollment = enrollmentTable(null);
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") return profilesStudent();
        if (table === "section_enrollments") return enrollment;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "admin-1" } });

    const res = await createStudentScholarship(validPayload);

    expect(res).toEqual({ ok: false, message: B.invalidData });
  });

  it("deactivates a single scholarship row", async () => {
    const scholarships = scholarshipDeactivateTable([{ id: scholarshipId }]);
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "section_enrollment_scholarships") return scholarships;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "admin-1" } });

    const res = await deactivateStudentScholarship({
      locale: "es",
      studentId,
      sectionId,
      scholarshipId,
    });

    expect(res).toEqual({ ok: true });
    expect(scholarships.update).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
  });
});
