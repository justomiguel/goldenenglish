/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  adminFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mocks.adminFrom }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerAuthzDenied: vi.fn(),
}));

import { assignParentShopOrder } from "@/app/[locale]/dashboard/parent/shop/orders/actions";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const ORDER_ID = "00000000-0000-4000-8000-000000000011";
const CHILD_ID = "00000000-0000-4000-8000-000000000033";
const OTHER_ID = "00000000-0000-4000-8000-000000000044";
const PARENT_ID = "parent-1";

function orderSelect(row: Record<string, unknown> | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
      }),
    }),
  };
}

function linksSelect(studentIds: string[]) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: studentIds.map((student_id) => ({ student_id })),
        error: null,
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: PARENT_ID } } });
  mocks.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: "parent" }, error: null }),
          }),
        }),
      };
    }
    if (table === "shop_orders") {
      return orderSelect({ status: "paid", buyer_id: PARENT_ID });
    }
    if (table === "tutor_student_rel") {
      return linksSelect([CHILD_ID]);
    }
    throw new Error(`unexpected ${table}`);
  });
  const eq = vi.fn().mockResolvedValue({ error: null });
  mocks.adminFrom.mockReturnValue({
    update: vi.fn().mockReturnValue({ eq }),
  });
});

describe("assignParentShopOrder", () => {
  it("rejects a student who is not a linked child", async () => {
    const r = await assignParentShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      studentId: OTHER_ID,
    });
    expect(r).toEqual({ ok: false, code: "not_child" });
    expect(mocks.adminFrom).not.toHaveBeenCalled();
  });

  it("assigns a linked child on a paid order", async () => {
    const r = await assignParentShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      studentId: CHILD_ID,
    });
    expect(r).toEqual({ ok: true });
    expect(mocks.adminFrom).toHaveBeenCalledWith("shop_orders");
  });

  it("logs save_failed when the assign update errors", async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: "fail" } });
    mocks.adminFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq }),
    });
    const r = await assignParentShopOrder({
      locale: "en",
      orderId: ORDER_ID,
      studentId: CHILD_ID,
    });
    expect(r).toEqual({ ok: false, code: "save_failed" });
    expect(logSupabaseClientError).toHaveBeenCalledWith(
      "assignParentShopOrder",
      { message: "fail" },
      { orderId: ORDER_ID },
    );
  });
});
