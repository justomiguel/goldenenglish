import { describe, expect, it, vi } from "vitest";
import { loadRegistrationStatusCounts } from "@/lib/dashboard/loadRegistrationStatusCounts";
import type { SupabaseClient } from "@supabase/supabase-js";

function clientReturning(data: unknown, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { client: { rpc } as unknown as SupabaseClient, rpc };
}

describe("loadRegistrationStatusCounts", () => {
  it("passes the active search so the chips count the same rows the list shows", async () => {
    const { client, rpc } = clientReturning([{ total: 7, new_count: 5, contacted_count: 2 }]);

    const counts = await loadRegistrationStatusCounts(client, "ana");

    expect(rpc).toHaveBeenCalledWith("registrations_admin_list_aggregates", { p_query: "ana" });
    expect(counts).toEqual({ total: 7, new: 5, contacted: 2 });
  });

  it("reads a single object as well as a one-row array", async () => {
    const { client } = clientReturning({ total: 3, new_count: 1, contacted_count: 2 });

    expect(await loadRegistrationStatusCounts(client, "")).toEqual({
      total: 3,
      new: 1,
      contacted: 2,
    });
  });

  it("falls back to zeros when the RPC fails, so the page still renders", async () => {
    const { client } = clientReturning(null, { message: "boom" });

    expect(await loadRegistrationStatusCounts(client, "")).toEqual({
      total: 0,
      new: 0,
      contacted: 0,
    });
  });

  it("falls back to zeros when the RPC returns no rows", async () => {
    const { client } = clientReturning([]);

    expect(await loadRegistrationStatusCounts(client, "")).toEqual({
      total: 0,
      new: 0,
      contacted: 0,
    });
  });
});
