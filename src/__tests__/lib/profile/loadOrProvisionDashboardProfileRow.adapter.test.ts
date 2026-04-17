/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@supabase/supabase-js";

const sessionFromMock = vi.fn();
const adminFromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: (...a: unknown[]) => sessionFromMock(...a),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: (...a: unknown[]) => adminFromMock(...a),
  })),
}));

function makeSelectChain(result: { data: unknown; error?: unknown } | { data: null }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function makeInsertChain(result: { data: unknown; error: unknown }) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "user@example.com",
    user_metadata: {},
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as User;
}

describe("loadOrProvisionDashboardProfileRow adapter", () => {
  beforeEach(() => {
    sessionFromMock.mockReset();
    adminFromMock.mockReset();
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("returns the row when the session client finds a full profile", async () => {
    const row = { first_name: "A", last_name: "B" };
    sessionFromMock.mockReturnValueOnce(makeSelectChain({ data: row }));
    const { loadOrProvisionDashboardProfileRow } = await import(
      "@/lib/profile/loadOrProvisionDashboardProfileRow"
    );
    const out = await loadOrProvisionDashboardProfileRow(fakeUser());
    expect(out).toEqual(row);
  });

  it("falls back to the legacy column set when the full select returns no row", async () => {
    sessionFromMock.mockReturnValueOnce(makeSelectChain({ data: null })); // full
    const fallback = { first_name: "F", last_name: "L" };
    sessionFromMock.mockReturnValueOnce(makeSelectChain({ data: fallback })); // fallback
    const { loadOrProvisionDashboardProfileRow } = await import(
      "@/lib/profile/loadOrProvisionDashboardProfileRow"
    );
    const out = await loadOrProvisionDashboardProfileRow(fakeUser());
    expect(out).toEqual(fallback);
  });

  it("returns null when no row exists and SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    sessionFromMock.mockReturnValue(makeSelectChain({ data: null }));
    const { loadOrProvisionDashboardProfileRow } = await import(
      "@/lib/profile/loadOrProvisionDashboardProfileRow"
    );
    const out = await loadOrProvisionDashboardProfileRow(fakeUser());
    expect(out).toBeNull();
  });

  it("returns admin-side row when service role finds an existing profile", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    sessionFromMock.mockReturnValue(makeSelectChain({ data: null }));
    const adminRow = { first_name: "X", last_name: "Y" };
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: adminRow })); // admin full
    const { loadOrProvisionDashboardProfileRow } = await import(
      "@/lib/profile/loadOrProvisionDashboardProfileRow"
    );
    const out = await loadOrProvisionDashboardProfileRow(fakeUser());
    expect(out).toEqual(adminRow);
  });

  it("inserts a provisioning row when admin select also finds nothing", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    sessionFromMock.mockReturnValue(makeSelectChain({ data: null }));
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: null })); // admin full
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: null })); // admin fallback
    const inserted = { first_name: "user", last_name: "—", role: "student" };
    adminFromMock.mockReturnValueOnce(makeInsertChain({ data: inserted, error: null }));
    const { loadOrProvisionDashboardProfileRow } = await import(
      "@/lib/profile/loadOrProvisionDashboardProfileRow"
    );
    const out = await loadOrProvisionDashboardProfileRow(
      fakeUser({
        user_metadata: {
          first_name: "John",
          last_name: "Doe",
          role: "teacher",
          phone: "+5491111",
          birth_date: "2000-05-04",
          dni_or_passport: "ABC123",
        },
      }),
    );
    expect(out).toEqual(inserted);
  });

  it("retries on duplicate-key error then returns null when subsequent select still empty", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    sessionFromMock.mockReturnValue(makeSelectChain({ data: null }));
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: null })); // admin full
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: null })); // admin fallback
    const dup = { code: "23505", message: "duplicate key" };
    adminFromMock.mockReturnValueOnce(makeInsertChain({ data: null, error: dup }));
    adminFromMock.mockReturnValueOnce(makeInsertChain({ data: null, error: dup }));
    adminFromMock.mockReturnValueOnce(makeInsertChain({ data: null, error: dup }));
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: null })); // final full
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: null })); // final fallback
    const { loadOrProvisionDashboardProfileRow } = await import(
      "@/lib/profile/loadOrProvisionDashboardProfileRow"
    );
    const out = await loadOrProvisionDashboardProfileRow(fakeUser());
    expect(out).toBeNull();
  });

  it("breaks out of insert loop on non-duplicate error and re-selects", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    sessionFromMock.mockReturnValue(makeSelectChain({ data: null }));
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: null })); // admin full
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: null })); // admin fallback
    adminFromMock.mockReturnValueOnce(
      makeInsertChain({ data: null, error: { code: "42501", message: "rls" } }),
    );
    const recovered = { first_name: "R", last_name: "C" };
    adminFromMock.mockReturnValueOnce(makeSelectChain({ data: recovered })); // final full
    const { loadOrProvisionDashboardProfileRow } = await import(
      "@/lib/profile/loadOrProvisionDashboardProfileRow"
    );
    const out = await loadOrProvisionDashboardProfileRow(fakeUser());
    expect(out).toEqual(recovered);
  });

  it("returns null when admin client throws", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    sessionFromMock.mockReturnValue(makeSelectChain({ data: null }));
    adminFromMock.mockImplementation(() => {
      throw new Error("admin boom");
    });
    const { loadOrProvisionDashboardProfileRow } = await import(
      "@/lib/profile/loadOrProvisionDashboardProfileRow"
    );
    const out = await loadOrProvisionDashboardProfileRow(fakeUser());
    expect(out).toBeNull();
  });
});
