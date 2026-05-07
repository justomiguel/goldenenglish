import { describe, it, expect, vi, beforeEach } from "vitest";
import { findAuthUserIdByNormalizedEmail } from "@/lib/supabase/findAuthUserIdByNormalizedEmail";

const mockListUsers = vi.fn();

const admin = {
  auth: {
    admin: {
      listUsers: (...args: unknown[]) => mockListUsers(...args),
    },
  },
} as unknown as import("@supabase/supabase-js").SupabaseClient;

describe("findAuthUserIdByNormalizedEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for empty email", async () => {
    const r = await findAuthUserIdByNormalizedEmail(admin, "  ");
    expect(r).toEqual({ userId: null, error: null });
    expect(mockListUsers).not.toHaveBeenCalled();
  });

  it("matches email case-insensitively on first page", async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          { id: "a", email: "Other@X.com" },
          { id: "b", email: "TARGET@test.com" },
        ],
      },
      error: null,
    });
    const r = await findAuthUserIdByNormalizedEmail(admin, "target@test.com");
    expect(r).toEqual({ userId: "b", error: null });
    expect(mockListUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
  });

  it("pages until match", async () => {
    mockListUsers
      .mockResolvedValueOnce({
        data: { users: Array.from({ length: 1000 }, (_, i) => ({ id: `p1-${i}`, email: `u${i}@a.com` })) },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { users: [{ id: "found", email: "want@here.com" }] },
        error: null,
      });
    const r = await findAuthUserIdByNormalizedEmail(admin, "want@here.com");
    expect(r.userId).toBe("found");
    expect(mockListUsers).toHaveBeenCalledTimes(2);
  });

  it("returns null when exhausted without match", async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: "x", email: null }] },
      error: null,
    });
    const r = await findAuthUserIdByNormalizedEmail(admin, "none@x.com");
    expect(r).toEqual({ userId: null, error: null });
  });

  it("propagates listUsers error", async () => {
    mockListUsers.mockResolvedValue({
      data: null,
      error: { message: "rate limited" },
    });
    const r = await findAuthUserIdByNormalizedEmail(admin, "a@b.com");
    expect(r).toEqual({ userId: null, error: { message: "rate limited" } });
  });
});
