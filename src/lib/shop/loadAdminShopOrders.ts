import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { expireStaleShopOrders } from "@/lib/shop/expireStaleShopOrders";
import { parseShopOrderStatus } from "@/lib/shop/shopOrderActionShared";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { ShopOrderStatus } from "@/lib/shop/types";

const LIMIT = 80;

export type AdminShopOrderRow = {
  id: string;
  status: ShopOrderStatus;
  currency: string;
  total: number;
  buyerEmail: string;
  assigneeStudentId: string | null;
  assigneeName: string;
  items: string;
};

type OrderRow = {
  id: string;
  status: string;
  currency: string;
  total: number;
  buyer_email: string;
  assignee_student_id: string | null;
  shop_order_items?: Array<{ title: string; size: string; color: string; quantity: number }> | null;
};

export async function loadAdminShopOrders(input: {
  supabase: SupabaseClient;
  status?: string | null;
}): Promise<AdminShopOrderRow[]> {
  await expireStaleShopOrders();
  const status = input.status ? parseShopOrderStatus(input.status) : null;
  let q = input.supabase
    .from("shop_orders")
    .select(
      "id, status, currency, total, buyer_email, assignee_student_id, shop_order_items(title, size, color, quantity)",
    )
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as OrderRow[];
  const names = await loadAssigneeNames(
    input.supabase,
    rows.map((r) => r.assignee_student_id).filter((id): id is string => Boolean(id)),
  );
  return rows.flatMap((row) => {
    const parsed = parseShopOrderStatus(row.status);
    if (!parsed) return [];
    return [
      {
        id: row.id,
        status: parsed,
        currency: row.currency,
        total: Number(row.total),
        buyerEmail: row.buyer_email,
        assigneeStudentId: row.assignee_student_id,
        assigneeName: row.assignee_student_id ? (names.get(row.assignee_student_id) ?? "") : "",
        items: (row.shop_order_items ?? [])
          .map((item) => `${item.title} ${item.size}/${item.color} ×${item.quantity}`)
          .join(" · "),
      },
    ];
  });
}

export async function loadAdminShopStudentOptions(
  supabase: SupabaseClient,
): Promise<Array<{ id: string; label: string }>> {
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "student")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .limit(LIMIT);
  return (data ?? []).map((p) => ({
    id: p.id as string,
    label: formatProfileSnakeSurnameFirst(p as { first_name: string | null; last_name: string | null }),
  }));
}

async function loadAssigneeNames(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", unique);
  return new Map(
    (data ?? []).map((p) => [
      p.id as string,
      formatProfileSnakeSurnameFirst(p as { first_name: string | null; last_name: string | null }),
    ]),
  );
}
