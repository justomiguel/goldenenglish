import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseShopOrderStatus } from "@/lib/shop/shopOrderActionShared";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { ShopOrderStatus } from "@/lib/shop/types";

const LIMIT = 80;

export type FamilyShopOrderRow = {
  id: string;
  status: ShopOrderStatus;
  currency: string;
  total: number;
  assigneeStudentId: string | null;
  assigneeName: string;
  items: Array<{ title: string; size: string; color: string; quantity: number; unitPrice: number }>;
};

export type ShopAssignOption = { id: string; label: string };

type OrderRow = {
  id: string;
  status: string;
  currency: string;
  total: number;
  assignee_student_id: string | null;
  shop_order_items?: Array<{
    title: string;
    size: string;
    color: string;
    quantity: number;
    unit_price: number;
  }> | null;
};

export async function loadBuyerShopOrders(
  supabase: SupabaseClient,
  buyerId: string,
): Promise<FamilyShopOrderRow[]> {
  return loadOrders(supabase, "buyer_id", buyerId);
}

export async function loadAssignedShopOrders(
  supabase: SupabaseClient,
  studentId: string,
): Promise<FamilyShopOrderRow[]> {
  return loadOrders(supabase, "assignee_student_id", studentId);
}

export async function loadTutorShopChildren(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<ShopAssignOption[]> {
  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", tutorId)
    .limit(LIMIT);
  const ids = (links ?? []).map((row) => row.student_id as string);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", ids);
  return (profiles ?? []).map((p) => ({
    id: p.id as string,
    label: formatProfileSnakeSurnameFirst(p as { first_name: string | null; last_name: string | null }),
  }));
}

async function loadOrders(
  supabase: SupabaseClient,
  column: "buyer_id" | "assignee_student_id",
  id: string,
): Promise<FamilyShopOrderRow[]> {
  const { data } = await supabase
    .from("shop_orders")
    .select(
      "id, status, currency, total, assignee_student_id, shop_order_items(title, size, color, quantity, unit_price)",
    )
    .eq(column, id)
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  const rows = (data ?? []) as OrderRow[];
  const names = await loadNames(
    supabase,
    rows.map((r) => r.assignee_student_id).filter((value): value is string => Boolean(value)),
  );
  return rows.flatMap((row) => {
    const status = parseShopOrderStatus(row.status);
    if (!status) return [];
    return [
      {
        id: row.id,
        status,
        currency: row.currency,
        total: Number(row.total),
        assigneeStudentId: row.assignee_student_id,
        assigneeName: row.assignee_student_id ? (names.get(row.assignee_student_id) ?? "") : "",
        items: (row.shop_order_items ?? []).map((item) => ({
          title: item.title,
          size: item.size,
          color: item.color,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
        })),
      },
    ];
  });
}

async function loadNames(supabase: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
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
