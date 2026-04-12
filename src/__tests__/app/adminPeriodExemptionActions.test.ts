/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import {
  setPeriodExemption,
  applyExemptionRange,
} from "@/app/[locale]/dashboard/admin/users/[userId]/billing/periodExemptionActions";

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
    const pay = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "p1", status: "approved", amount: 100 },
        error: null,
      }),
    };
    mockAssertAdmin.mockResolvedValue({
      supabase: { from: vi.fn((t: string) => (t === "profiles" ? profilesStudent() : pay)) },
    });
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
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const pay = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "p1", status: "pending", amount: 50 },
        error: null,
      }),
      update,
    };
    mockAssertAdmin.mockResolvedValue({
      supabase: { from: vi.fn((t: string) => (t === "profiles" ? profilesStudent() : pay)) },
    });
    const r = await setPeriodExemption({
      locale: "es",
      studentId: sid,
      year: 2026,
      month: 4,
      exempt: true,
      adminNote: " ok ",
    });
    expect(r).toEqual({ ok: true });
    expect(update).toHaveBeenCalled();
  });

  it("inserts exempt row when none exists", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const pay = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert,
    };
    mockAssertAdmin.mockResolvedValue({
      supabase: { from: vi.fn((t: string) => (t === "profiles" ? profilesStudent() : pay)) },
    });
    const r = await setPeriodExemption({
      locale: "es",
      studentId: sid,
      year: 2026,
      month: 5,
      exempt: true,
    });
    expect(r).toEqual({ ok: true });
    expect(insert).toHaveBeenCalled();
  });
});

describe("applyExemptionRange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({
      supabase: {
        from: vi.fn((t: string) => {
          if (t === "profiles") return profilesStudent();
          const pay = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
          return pay;
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
