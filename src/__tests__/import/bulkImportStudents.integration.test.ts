// REGRESSION CHECK: Mocks Supabase server/admin clients — changes to assertAdmin or
// createAdminClient chains may require updating this file.

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateClient = vi.fn();
const mockCreateAdmin = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockCreateAdmin(),
}));

import { bulkImportStudentsFromRows } from "@/app/[locale]/dashboard/admin/import/actions";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { IMPORT_INVALID_CSV_PAYLOAD } from "@/lib/import/parseImportErrorCodes";

function adminChain() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  };
  return chain;
}

function setupSessionAsAdmin() {
  const profilesChain = adminChain();
  profilesChain.maybeSingle.mockResolvedValue({
    data: { role: "admin" },
    error: null,
  });
  profilesChain.single.mockResolvedValue({
    data: { role: "admin" },
    error: null,
  });

  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-id" } } }),
    },
    from: vi.fn(() => profilesChain),
    rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
  });
}

describe("bulkImportStudentsFromRows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when not authenticated", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    await expect(bulkImportStudentsFromRows("es", [])).rejects.toThrow(
      ADMIN_SESSION_UNAUTHORIZED,
    );
  });

  it("throws when role is not admin", async () => {
    const chain = adminChain();
    chain.maybeSingle.mockResolvedValue({
      data: { role: "student" },
      error: null,
    });
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn(() => chain),
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    });

    await expect(bulkImportStudentsFromRows("es", [])).rejects.toThrow(ADMIN_SESSION_FORBIDDEN);
  });

  it("throws on invalid zod payload", async () => {
    setupSessionAsAdmin();
    mockCreateAdmin.mockReturnValue({});

    await expect(
      bulkImportStudentsFromRows("es", [{ first_name: "" }]),
    ).rejects.toThrow(IMPORT_INVALID_CSV_PAYLOAD);
  });

  it("returns zeros for empty valid payload", async () => {
    setupSessionAsAdmin();
    mockCreateAdmin.mockReturnValue({
      from: vi.fn(),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        },
      },
    });

    const result = await bulkImportStudentsFromRows("es", []);
    expect(result).toEqual({
      processed: 0,
      createdUsers: 0,
      enrolled: 0,
      paymentsSeeded: 0,
      profilesUpdated: 0,
      skippedNoop: 0,
      results: [],
    });
  });

  it("creates user when profile not found by dni", async () => {
    setupSessionAsAdmin();

    const chain = adminChain();
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    chain.single.mockResolvedValue({
      data: {
        id: "new-id",
        role: "student",
        phone: null,
        birth_date: null,
        dni_or_passport: "999999",
      },
      error: null,
    });

    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "new-id" } },
      error: null,
    });
    const listUsers = vi.fn().mockResolvedValue({ data: { users: [] }, error: null });

    mockCreateAdmin.mockReturnValue({
      from: vi.fn(() => chain),
      auth: { admin: { createUser, listUsers } },
    });

    const result = await bulkImportStudentsFromRows("es", [
      {
        first_name: "Ada",
        last_name: "Lovelace",
        dni_or_passport: "999999",
      },
    ]);

    expect(createUser).toHaveBeenCalled();
    expect(result.createdUsers).toBe(1);
    expect(result.processed).toBe(1);
    expect(result.paymentsSeeded).toBe(12);
    expect(result.results[0]).toMatchObject({ ok: true, rowIndex: 1 });
  });
});
