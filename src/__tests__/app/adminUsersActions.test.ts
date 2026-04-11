import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockCreateUser = vi.fn();
const mockAdminClient = {
  auth: {
    admin: {
      createUser: (...args: unknown[]) => mockCreateUser(...args),
    },
  },
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient,
}));

const validPayload = {
  email: "u@test.com",
  password: "secret12",
  role: "student" as const,
  first_name: "A",
  last_name: "B",
  dni_or_passport: "1",
  phone: "+100000",
};

describe("createDashboardUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Forbidden when not admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: false, message: "Forbidden" });
  });

  it("returns Invalid data when schema fails", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const r = await createDashboardUser({
      ...validPayload,
      email: "not-an-email",
    });
    expect(r).toEqual({ ok: false, message: "Invalid data" });
  });

  it("returns auth error message from createUser", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "exists" },
    });
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: false, message: "exists" });
  });

  it("returns message when API omits user", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: false, message: "No user returned" });
  });

  it("returns ok on success", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "x" } },
      error: null,
    });
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: true });
  });

  it("passes optional birth_date in user_metadata", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "x" } },
      error: null,
    });
    const r = await createDashboardUser({
      ...validPayload,
      birth_date: "2012-01-15",
    });
    expect(r).toEqual({ ok: true });
    const call = mockCreateUser.mock.calls[0][0] as {
      user_metadata: Record<string, string>;
    };
    expect(call.user_metadata.birth_date).toBe("2012-01-15");
  });

  it("generates password when empty and succeeds", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "x" } },
      error: null,
    });
    const r = await createDashboardUser({
      email: "gen@test.com",
      password: "",
      first_name: "A",
      last_name: "B",
      dni_or_passport: "2",
      phone: "+1999",
    });
    expect(r).toEqual({ ok: true });
    const call = mockCreateUser.mock.calls[0][0] as { password: string };
    expect(call.password.length).toBeGreaterThanOrEqual(6);
  });

  it("rejects short non-empty password", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const r = await createDashboardUser({
      ...validPayload,
      password: "12345",
    });
    expect(r.ok).toBe(false);
  });
});
