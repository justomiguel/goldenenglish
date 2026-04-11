import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  acceptRegistration,
  deleteRegistration,
} from "@/app/[locale]/dashboard/admin/registrations/actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockCreateUser = vi.fn();
vi.mock("@/app/[locale]/dashboard/admin/users/actions", () => ({
  createDashboardUser: (...args: unknown[]) => mockCreateUser(...args),
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";

const regNew = {
  id: REG_ID,
  status: "new",
  first_name: "A",
  last_name: "B",
  dni: "123",
  email: "a@test.com",
  phone: "+1",
  birth_date: "2010-05-01",
};

describe("deleteRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Forbidden when not admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await deleteRegistration("es", regNew.id);
    expect(r).toEqual({ ok: false, message: "Forbidden" });
  });

  it("deletes and returns ok", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      delete: () => ({
        eq,
      }),
    });
    const r = await deleteRegistration("es", regNew.id);
    expect(r.ok).toBe(true);
    expect(eq).toHaveBeenCalledWith("id", regNew.id);
  });
});

describe("acceptRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Forbidden when not admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await acceptRegistration("es", {
      registration_id: regNew.id,
    });
    expect(r).toEqual({ ok: false, message: "Forbidden" });
  });

  it("returns Not found when row missing", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: false, message: "Not found" });
  });

  it("returns already_processed when status is not new", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: { ...regNew, status: "enrolled" }, error: null }),
        }),
      }),
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: false, message: "already_processed" });
  });

  it("uses registration birth_date when accept payload omits birth_date", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: true });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { ...regNew, birth_date: "2008-03-15" },
              error: null,
            }),
        }),
      }),
      update: () => ({
        eq: updateEq,
      }),
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r.ok).toBe(true);
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ birth_date: "2008-03-15" }),
    );
  });

  it("creates user, updates status, returns ok", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: true });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: regNew, error: null }),
        }),
      }),
      update: () => ({
        eq: updateEq,
      }),
    });
    const r = await acceptRegistration("es", {
      registration_id: regNew.id,
      password: "",
      birth_date: "2010-05-01",
    });
    expect(r.ok).toBe(true);
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "a@test.com",
        role: "student",
        birth_date: "2010-05-01",
      }),
    );
    expect(updateEq).toHaveBeenCalledWith("id", regNew.id);
  });

  it("forwards createDashboardUser failure", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: false, message: "exists" });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: regNew, error: null }),
        }),
      }),
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: false, message: "exists" });
  });
});
