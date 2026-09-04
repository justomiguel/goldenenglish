/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertAdmin: vi.fn(),
  notify: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mocks.assertAdmin(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/shop/notifyShopEmail", () => ({
  notifyShopEmail: (...args: unknown[]) => mocks.notify(...args),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerAuthzDenied: vi.fn(),
}));

import {
  assignAdminShopOrder,
  transitionAdminShopOrder,
} from "@/app/[locale]/dashboard/admin/merch/orders/actions";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const ORDER_ID = "00000000-0000-4000-8000-000000000011";
const STUDENT_ID = "00000000-0000-4000-8000-000000000022";
const adminUser = { id: "11111111-1111-1111-1111-111111111111" };

function selectOrder(row: Record<string, unknown> | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
      }),
    }),
  };
}

function updateOrder(ok = true) {
  const eq = vi.fn().mockResolvedValue({ error: ok ? null : { message: "fail" } });
  return { update: vi.fn().mockReturnValue({ eq }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.assertAdmin.mockResolvedValue({
    user: adminUser,
    supabase: { from: mocks.from },
  });
  mocks.notify.mockResolvedValue(undefined);
});

describe("transitionAdminShopOrder", () => {
  it("returns forbidden when assertAdmin throws", async () => {
    mocks.assertAdmin.mockRejectedValue(new Error("x"));
    const r = await transitionAdminShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      to: "ready_for_pickup",
    });
    expect(r).toEqual({ ok: false, code: "forbidden" });
  });

  it("denies paid → picked_up and does not write", async () => {
    const select = selectOrder({
      status: "paid",
      buyer_email: "ada@school.cl",
      pay_token: "tok",
    });
    const update = updateOrder();
    mocks.from.mockImplementation((table: string) => {
      if (table === "shop_orders") return { ...select, ...update };
      throw new Error(`unexpected ${table}`);
    });
    const r = await transitionAdminShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      to: "picked_up",
    });
    expect(r).toEqual({ ok: false, code: "illegal_status" });
    expect(update.update).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("marks ready and sends shop.order_ready", async () => {
    const select = selectOrder({
      status: "paid",
      buyer_email: "ada@school.cl",
      pay_token: "tok",
    });
    const update = updateOrder();
    mocks.from.mockImplementation((table: string) => {
      if (table === "shop_orders") return { ...select, ...update };
      throw new Error(`unexpected ${table}`);
    });
    const r = await transitionAdminShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      to: "ready_for_pickup",
    });
    expect(r).toEqual({ ok: true });
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ready_for_pickup" }),
    );
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@school.cl",
        key: "shop.order_ready",
      }),
    );
  });

  it("cancels without touching variant stock", async () => {
    const select = selectOrder({
      status: "paid",
      buyer_email: "ada@school.cl",
      pay_token: "tok",
    });
    const update = updateOrder();
    const tables: string[] = [];
    mocks.from.mockImplementation((table: string) => {
      tables.push(table);
      if (table === "shop_orders") return { ...select, ...update };
      throw new Error(`unexpected ${table}`);
    });
    const r = await transitionAdminShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      to: "cancelled",
    });
    expect(r).toEqual({ ok: true });
    expect(tables).toEqual(["shop_orders", "shop_orders"]);
    expect(update.update).toHaveBeenCalledWith({ status: "cancelled" });
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("logs save_failed when the status update errors", async () => {
    const select = selectOrder({
      status: "paid",
      buyer_email: "ada@school.cl",
      pay_token: "tok",
    });
    const update = updateOrder(false);
    mocks.from.mockImplementation((table: string) => {
      if (table === "shop_orders") return { ...select, ...update };
      throw new Error(`unexpected ${table}`);
    });
    const r = await transitionAdminShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      to: "cancelled",
    });
    expect(r).toEqual({ ok: false, code: "save_failed" });
    expect(logSupabaseClientError).toHaveBeenCalledWith(
      "transitionAdminShopOrder",
      { message: "fail" },
      { orderId: ORDER_ID },
    );
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});

describe("assignAdminShopOrder", () => {
  it("assigns any student when admin", async () => {
    const select = selectOrder({
      status: "paid",
      buyer_id: "buyer-1",
    });
    const update = updateOrder();
    mocks.from.mockImplementation((table: string) => {
      if (table === "shop_orders") return { ...select, ...update };
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "student" },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });
    const r = await assignAdminShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      studentId: STUDENT_ID,
    });
    expect(r).toEqual({ ok: true });
    expect(update.update).toHaveBeenCalledWith({ assignee_student_id: STUDENT_ID });
  });

  it("logs save_failed when the assign update errors", async () => {
    const select = selectOrder({
      status: "paid",
      buyer_id: "buyer-1",
    });
    const update = updateOrder(false);
    mocks.from.mockImplementation((table: string) => {
      if (table === "shop_orders") return { ...select, ...update };
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "student" },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });
    const r = await assignAdminShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      studentId: STUDENT_ID,
    });
    expect(r).toEqual({ ok: false, code: "save_failed" });
    expect(logSupabaseClientError).toHaveBeenCalledWith(
      "assignAdminShopOrder",
      { message: "fail" },
      { orderId: ORDER_ID },
    );
  });
});
