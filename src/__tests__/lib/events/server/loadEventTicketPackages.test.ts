import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadEventTicketPackages,
  loadEventTicketPackageSeatsSold,
} from "@/lib/events/server/loadEventTicketPackages";

type PackageRow = Record<string, unknown>;

function mockPackagesClient(rows: PackageRow[]) {
  const isNull = vi.fn();
  const order = vi.fn();
  const builder: Record<string, unknown> = {};
  const result = Promise.resolve({ data: rows, error: null });

  Object.assign(builder, {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    is: (...args: unknown[]) => {
      isNull(...args);
      return builder;
    },
    order: (...args: unknown[]) => {
      order(...args);
      return builder;
    },
    then: (...args: Parameters<Promise<unknown>["then"]>) => result.then(...args),
  });

  const supabase = { from: vi.fn(() => builder) } as unknown as SupabaseClient;
  return { supabase, builder, isNull, order };
}

const row = (over: PackageRow = {}): PackageRow => ({
  id: "p1",
  name: "General",
  price: "5000.00",
  capacity: 20,
  benefits: ["Entrada"],
  position: 0,
  archived_at: null,
  ...over,
});

describe("loadEventTicketPackages", () => {
  it("orders by position then creation, so the admin's order is what buyers see", async () => {
    const { supabase, order } = mockPackagesClient([row()]);
    await loadEventTicketPackages(supabase, "ev-1");

    expect(order.mock.calls[0]?.[0]).toBe("position");
    expect(order.mock.calls[1]?.[0]).toBe("created_at");
  });

  it("hides archived packages unless they are asked for", async () => {
    const a = mockPackagesClient([row()]);
    await loadEventTicketPackages(a.supabase, "ev-1");
    expect(a.isNull).toHaveBeenCalledWith("archived_at", null);

    const b = mockPackagesClient([row()]);
    await loadEventTicketPackages(b.supabase, "ev-1", { includeArchived: true });
    expect(b.isNull).not.toHaveBeenCalled();
  });

  it("normalises the money and the benefits", async () => {
    const { supabase } = mockPackagesClient([
      row({ price: "5000.00", benefits: null, capacity: null }),
    ]);
    const [pkg] = await loadEventTicketPackages(supabase, "ev-1");

    expect(pkg?.price).toBe(5000);
    expect(pkg?.benefits).toEqual([]);
    expect(pkg?.capacity).toBeNull();
  });

  it("returns nothing rather than throwing when the query fails", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            is: () => ({
              order: () => ({
                order: () => Promise.resolve({ data: null, error: { message: "boom" } }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    await expect(loadEventTicketPackages(supabase, "ev-1")).resolves.toEqual([]);
  });
});

describe("loadEventTicketPackageSeatsSold", () => {
  it("counts the same two statuses the RPC counts", async () => {
    // If this drifts, the public "3 left" starts contradicting what the RPC
    // actually allows at checkout.
    const inCall = vi.fn();
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            in: (...args: unknown[]) => {
              inCall(...args);
              return Promise.resolve({
                data: [{ ticket_package_id: "p1" }, { ticket_package_id: "p1" }],
                error: null,
              });
            },
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const sold = await loadEventTicketPackageSeatsSold(supabase, "ev-1");

    expect(inCall).toHaveBeenCalledWith("status", ["confirmed", "pending_payment"]);
    expect(sold.get("p1")).toBe(2);
  });

  it("ignores seats that belong to no package", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            in: () =>
              Promise.resolve({
                data: [{ ticket_package_id: null }, { ticket_package_id: "p2" }],
                error: null,
              }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const sold = await loadEventTicketPackageSeatsSold(supabase, "ev-1");

    expect(sold.get("p2")).toBe(1);
    expect(sold.size).toBe(1);
  });
});
