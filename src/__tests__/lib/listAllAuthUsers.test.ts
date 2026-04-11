import { describe, it, expect, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listAllAuthUsers } from "@/lib/supabase/listAllAuthUsers";

function mockAdmin(listUsers: ReturnType<typeof vi.fn>): SupabaseClient {
  return {
    auth: {
      admin: { listUsers },
    },
  } as SupabaseClient;
}

describe("listAllAuthUsers", () => {
  it("uses a single request when the first page is not full", async () => {
    const u1 = { id: "a" } as User;
    const listUsers = vi.fn().mockResolvedValue({
      data: { users: [u1] },
      error: null,
    });

    const { users, error } = await listAllAuthUsers(mockAdmin(listUsers));
    expect(error).toBeNull();
    expect(users).toEqual([u1]);
    expect(listUsers).toHaveBeenCalledTimes(1);
    expect(listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
  });

  it("requests the next page when the first page is full", async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => ({ id: `u${i}` })) as User[];
    const page2 = [{ id: "last" }] as User[];
    const listUsers = vi
      .fn()
      .mockResolvedValueOnce({ data: { users: page1 }, error: null })
      .mockResolvedValueOnce({ data: { users: page2 }, error: null });

    const { users, error } = await listAllAuthUsers(mockAdmin(listUsers));
    expect(error).toBeNull();
    expect(users).toHaveLength(1001);
    expect(listUsers).toHaveBeenCalledTimes(2);
    expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 });
    expect(listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });
  });

  it("returns error from API", async () => {
    const err = new Error("fail");
    const listUsers = vi.fn().mockResolvedValue({ data: { users: [] }, error: err });
    const { users, error } = await listAllAuthUsers(mockAdmin(listUsers));
    expect(users).toEqual([]);
    expect(error).toBe(err);
  });
});
