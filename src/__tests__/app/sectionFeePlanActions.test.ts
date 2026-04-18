/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { upsertSectionFeePlanAction } from "@/app/[locale]/dashboard/admin/academic/sectionFeePlanActions";
import {
  archiveSectionFeePlanAction,
  deleteSectionFeePlanAction,
  restoreSectionFeePlanAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionFeePlanLifecycleActions";

const { mockAssertAdmin, recordSystemAudit, revalidatePath } = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
  revalidatePath: vi.fn(),
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

vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces: vi.fn(),
}));

const SEC = "00000000-0000-4000-8000-000000000001";
const PLAN = "00000000-0000-4000-8000-000000000aaa";
const USER = "00000000-0000-4000-8000-0000000000aa";

const baseInput = {
  locale: "en",
  sectionId: SEC,
  effectiveFromYear: 2026,
  effectiveFromMonth: 3,
  monthlyFee: 100,
  paymentsCount: 10,
  chargesEnrollmentFee: false,
  periodStartYear: 2026,
  periodStartMonth: 3,
} as const;

interface SectionsBuilderOpts {
  sectionData?: { id: string; cohort_id: string } | null;
}

function sectionsBuilder({ sectionData }: SectionsBuilderOpts = {}) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: sectionData ?? { id: SEC, cohort_id: "coh-1" }, error: null }),
      }),
    }),
  };
}

function chainEqEq(resolveTo: { error: unknown }) {
  return vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(resolveTo),
    }),
  });
}

describe("sectionFeePlanActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid input with PARSE", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: { from: vi.fn() }, user: { id: USER } });
    const res = await upsertSectionFeePlanAction({
      ...baseInput,
      sectionId: "not-a-uuid",
    });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("inserts a new plan when no planId provided", async () => {
    const insertSingle = vi.fn().mockResolvedValue({ data: { id: PLAN }, error: null });
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return sectionsBuilder();
      if (table === "section_fee_plans") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ single: insertSingle }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from }, user: { id: USER } });

    const res = await upsertSectionFeePlanAction({ ...baseInput });
    expect(res).toEqual({ ok: true, planId: PLAN });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "section_fee_plan_upserted",
        resourceType: "section_fee_plan",
        resourceId: PLAN,
      }),
    );
  });

  it("updates an existing plan when planId provided", async () => {
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return sectionsBuilder();
      if (table === "section_fee_plans") {
        return { update: chainEqEq({ error: null }) };
      }
      throw new Error(`unexpected ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from }, user: { id: USER } });

    const res = await upsertSectionFeePlanAction({ ...baseInput, planId: PLAN });
    expect(res).toEqual({ ok: true, planId: PLAN });
  });

  // REGRESSION CHECK: deleteSectionFeePlanAction debe rechazar el borrado
  // cuando hay payments que mapean al plan (integridad referencial: el admin
  // debe Archivar en su lugar). Cambiar este invariante rompe el contrato con
  // la UI y permite perder trazabilidad de pagos históricos.
  it("hard-deletes a plan with no payments", async () => {
    const planRows = [
      {
        id: PLAN,
        section_id: SEC,
        effective_from_year: 2026,
        effective_from_month: 1,
        monthly_fee: 100,
        payments_count: 10,
        charges_enrollment_fee: false,
        period_start_year: 2026,
        period_start_month: 1,
        archived_at: null,
      },
    ];
    let planSelectCall = 0;
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return sectionsBuilder();
      if (table === "section_fee_plans") {
        planSelectCall += 1;
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: planRows, error: null }),
          }),
          delete: chainEqEq({ error: null }),
        };
      }
      if (table === "payments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`unexpected ${table}: ${planSelectCall}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from }, user: { id: USER } });

    const res = await deleteSectionFeePlanAction({ locale: "en", sectionId: SEC, planId: PLAN });
    expect(res).toEqual({ ok: true });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "section_fee_plan_deleted",
        resourceId: PLAN,
      }),
    );
  });

  it("refuses hard delete with IN_USE when payments exist for the plan window", async () => {
    const planRows = [
      {
        id: PLAN,
        section_id: SEC,
        effective_from_year: 2026,
        effective_from_month: 1,
        monthly_fee: 100,
        payments_count: 10,
        charges_enrollment_fee: false,
        period_start_year: 2026,
        period_start_month: 1,
        archived_at: null,
      },
    ];
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return sectionsBuilder();
      if (table === "section_fee_plans") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: planRows, error: null }),
          }),
          delete: chainEqEq({ error: null }),
        };
      }
      if (table === "payments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ year: 2026, month: 4 }],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from }, user: { id: USER } });

    const res = await deleteSectionFeePlanAction({ locale: "en", sectionId: SEC, planId: PLAN });
    expect(res).toEqual({ ok: false, code: "IN_USE" });
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("archives a plan (soft delete) and audits the action", async () => {
    const update = chainEqEq({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return sectionsBuilder();
      if (table === "section_fee_plans") return { update };
      throw new Error(`unexpected ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from }, user: { id: USER } });

    const res = await archiveSectionFeePlanAction({ locale: "en", sectionId: SEC, planId: PLAN });
    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ archived_by: USER, archived_at: expect.any(String) }),
    );
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "section_fee_plan_archived", resourceId: PLAN }),
    );
  });

  it("restores an archived plan and audits the action", async () => {
    const update = chainEqEq({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return sectionsBuilder();
      if (table === "section_fee_plans") return { update };
      throw new Error(`unexpected ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from }, user: { id: USER } });

    const res = await restoreSectionFeePlanAction({ locale: "en", sectionId: SEC, planId: PLAN });
    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ archived_at: null, archived_by: null });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "section_fee_plan_restored", resourceId: PLAN }),
    );
  });
});
