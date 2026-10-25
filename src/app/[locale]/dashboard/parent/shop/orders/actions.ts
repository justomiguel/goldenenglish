"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  isAssignableShopOrderStatus,
  mayAssignShopOrder,
  parseShopOrderStatus,
  type ShopOrderActionResult,
} from "@/lib/shop/shopOrderActionShared";

const schema = z.object({
  locale: z.string().min(2),
  orderId: z.string().uuid(),
  studentId: z.string().uuid().nullable().optional(),
});

export async function assignParentShopOrder(
  raw: z.infer<typeof schema>,
): Promise<ShopOrderActionResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    logServerAuthzDenied("assignParentShopOrder");
    return { ok: false, code: "forbidden" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") {
    logServerAuthzDenied("assignParentShopOrder");
    return { ok: false, code: "forbidden" };
  }

  const { data: order } = await supabase
    .from("shop_orders")
    .select("status, buyer_id")
    .eq("id", parsed.data.orderId)
    .maybeSingle();
  const status = parseShopOrderStatus(String(order?.status ?? ""));
  if (!order || !status) return { ok: false, code: "not_found" };
  if (!isAssignableShopOrderStatus(status)) return { ok: false, code: "illegal_status" };

  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", user.id);
  const childIds = (links ?? []).map((row) => row.student_id as string);
  const studentId = parsed.data.studentId?.trim() || null;

  if (
    !mayAssignShopOrder({
      actorRole: "parent",
      actorId: user.id,
      buyerId: String(order.buyer_id),
      childIds,
      studentId,
    })
  ) {
    return { ok: false, code: "not_child" };
  }

  const admin = await createAdminClient();
  const { error } = await admin
    .from("shop_orders")
    .update({ assignee_student_id: studentId })
    .eq("id", parsed.data.orderId);
  if (error) {
    logSupabaseClientError("assignParentShopOrder", error, { orderId: parsed.data.orderId });
    return { ok: false, code: "save_failed" };
  }

  revalidatePath(`/${parsed.data.locale}/dashboard/parent/shop/orders`);
  revalidatePath(`/${parsed.data.locale}/dashboard/student/shop/orders`);
  return { ok: true };
}
