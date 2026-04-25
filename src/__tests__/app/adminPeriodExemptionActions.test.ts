/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import { setPeriodExemption } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/periodExemptionActions";
import { applyExemptionRange } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/applyExemptionRangeAction";

const B = es.actionErrors.billingStudent;

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling", () => ({
  revalidateStudentBillingPaths: vi.fn(),
}));

const sid = "00000000-0000-4000-8000-000000000001";

function profilesStudent() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: "student" }, error: null }),
  };
}

function sectionEnrollments(sectionIds = ["sec-1"]) {
  const response = {
    data: sectionIds.map((section_id) => ({ section_id })),
    error: null,
  };
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    then: (resolve: (v: typeof response) => void) => resolve(response),
  };
  return chain;
}

function paymentsTable(rows: unknown[]) {
  const response = { data: rows, error: null };
  const eqAfterWrite = vi.fn().mockResolvedValue({ error: null });
  const table = {
    select: vi.fn(() => table),
    eq: vi.fn(() => table),
    update: vi.fn(() => ({ eq: eqAfterWrite })),
    insert: vi.fn().mockResolvedValue({ error: null }),
    delete: vi.fn(() => ({ eq: eqAfterWrite })),
    then: (resolve: (v: typeof response) => void) => resolve(response),
    eqAfterWrite,
  };
  return table;
}

function supabaseFor(rows: unknown[], sectionIds = ["sec-1"]) {
  const payments = paymentsTable(rows);
  const from = vi.fn((t: string) => {
    if (t === "profiles") return profilesStudent();
    if (t === "section_enrollments") return sectionEnrollments(sectionIds);
    if (t === "payments") return payments;
    throw new Error(`Unexpected table ${t}`);
  });
  return { supabase: { from }, payments };
}

describe("setPeriodExemption", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid student id", async () => {
    const r = await setPeriodExemption({
      locale: "es",
      studentId: "bad",
      year: 2026,
      month: 3,
      exempt: true,
    });
    expect(r).toEqual({ ok: false, message: B.invalidStudent });
  });

  it("rejects invalid period", async () => {
    const r = await setPeriodExemption({
      locale: "es",
      studentId: sid,
      year: 1990,
      month: 13,
      exempt: true,
    });
    expect(r).toEqual({ ok: false, message: B.invalidPeriod });
  });

  it("returns forbidden when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("x"));
    const r = await setPeriodExemption({
      locale: "es",
      studentId: sid,
      year: 2026,
      month: 3,
      exempt: true,
    });
    expect(r).toEqual({ ok: false, message: B.forbidden });
  });

  it("rejects non-student profile", async () => {
    mockAssertAdmin.mockResolvedValue({
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: "parent" }, error: null }),
        })),
      },
    });
    const r = await setPeriodExemption({
      locale: "es",
      studentId: sid,
      year: 2026,
      month: 3,
      exempt: true,
    });
    expect(r).toEqual({ ok: false, message: B.notAStudent });
  });

  it("cannot exempt approved payment", async () => {
    const { supabase } = supabaseFor([
      { id: "p1", status: "approved", amount: 100, section_id: "sec-1" },
    ]);
    mockAssertAdmin.mockResolvedValue({ supabase });
    const r = await setPeriodExemption({
      locale: "es",
      studentId: sid,
      year: 2026,
      month: 3,
      exempt: true,
    });
    expect(r).toEqual({ ok: false, message: B.cannotExemptApproved });
  });

  it("updates pending row to exempt", async () => {
    const { supabase, payments } = supabaseFor([
      { id: "p1", status: "pending", amount: 50, section_id: "sec-1" },
    ]);
    mockAssertAdmin.mockResolvedValue({ supabase });
    const r = await setPeriodExemption({
      locale: "es",
      studentId: sid,
      year: 2026,
      month: 4,
      exempt: true,
      adminNote: " ok ",
    });
    expect(r).toEqual({ ok: true });
    expect(payments.update).toHaveBeenCalledWith(
      expect.objectContaining({ section_id: "sec-1", status: "exempt" }),
    );
  });

  it("inserts exempt row when none exists", async () => {
    const { supabase, payments } = supabaseFor([]);
    mockAssertAdmin.mockResolvedValue({ supabase });
    const r = await setPeriodExemption({
      locale: "es",
      studentId: sid,
      year: 2026,
      month: 5,
      exempt: true,
    });
    expect(r).toEqual({ ok: true });
    expect(payments.insert).toHaveBeenCalledWith(
      expect.objectContaining({ section_id: "sec-1", status: "exempt" }),
    );
  });

  it("reattributes a legacy exempt row to the active section", async () => {
    const { supabase, payments } = supabaseFor([
      { id: "legacy", status: "exempt", amount: 0, section_id: null },
    ]);
    mockAssertAdmin.mockResolvedValue({ supabase });
    const r = await setPeriodExemption({
      locale: "es",
      studentId: sid,
      year: 2026,
      month: 5,
      exempt: true,
    });
    expect(r).toEqual({ ok: true });
    expect(payments.update).toHaveBeenCalledWith(
      expect.objectContaining({ section_id: "sec-1", status: "exempt" }),
    );
  });
});

describe("applyExemptionRange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({
      supabase: {
        from: vi.fn((t: string) => {
          if (t === "profiles") return profilesStudent();
          if (t === "section_enrollments") return sectionEnrollments(["sec-1"]);
          if (t === "payments") return paymentsTable([]);
          throw new Error(`Unexpected table ${t}`);
        }),
      },
    });
  });

  it("rejects invalid range order", async () => {
    const r = await applyExemptionRange({
      locale: "es",
      studentId: sid,
      fromYear: 2026,
      fromMonth: 6,
      toYear: 2026,
      toMonth: 3,
    });
    expect(r).toEqual({ ok: false, message: B.invalidRangeOrder });
  });

  it("applies single month range", async () => {
    const r = await applyExemptionRange({
      locale: "es",
      studentId: sid,
      fromYear: 2026,
      fromMonth: 7,
      toYear: 2026,
      toMonth: 7,
    });
    expect(r).toEqual({ ok: true });
  });
});
