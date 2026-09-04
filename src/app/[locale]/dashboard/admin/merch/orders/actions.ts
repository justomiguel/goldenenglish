"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireMerchAdmin, merchLocaleSchema } from "@/app/[locale]/dashboard/admin/merch/merchActionShared";
import { notifyShopEmail } from "@/lib/shop/notifyShopEmail";
import { canTransitionShopOrder } from "@/lib/shop/shopOrderStatus";
import {
  ADMIN_SHOP_TRANSITIONS,
  isAssignableShopOrderStatus,
  mayAssignShopOrder,
  parseShopOrderStatus,
  shopOrderReadyMailVars,
  shopOrderTransitionPatch,
  type ShopOrderActionResult,
} from "@/lib/shop/shopOrderActionShared";

const transitionSchema = z.object({
  locale: merchLocaleSchema,
  orderId: z.string().uuid(),
  to: z.enum(ADMIN_SHOP_TRANSITIONS),
});

const assignSchema = z.object({
  locale: merchLocaleSchema,
  orderId: z.string().uuid(),
  studentId: z.string().uuid().nullable().optional(),
});

export async function transitionAdminShopOrder(
  raw: z.infer<typeof transitionSchema>,
): Promise<ShopOrderActionResult> {
  const parsed = transitionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const admin = await requireMerchAdmin();
  if (!admin.ok) return admin;

  const { data: row } = await admin.supabase
    .from("shop_orders")
    .select("status, buyer_email, pay_token")
    .eq("id", parsed.data.orderId)
    .maybeSingle();
  const from = parseShopOrderStatus(String(row?.status ?? ""));
  if (!row || !from) return { ok: false, code: "not_found" };
  if (!canTransitionShopOrder(from, parsed.data.to)) return { ok: false, code: "illegal_status" };

  const { error } = await admin.supabase
    .from("shop_orders")
    .update(shopOrderTransitionPatch(parsed.data.to, new Date().toISOString()))
    .eq("id", parsed.data.orderId);
  if (error) return { ok: false, code: "save_failed" };

  if (parsed.data.to === "ready_for_pickup") {
    const to = String(row.buyer_email ?? "").trim();
    const token = String(row.pay_token ?? "").trim();
    if (to && token) {
      await notifyShopEmail({
        to,
        key: "shop.order_ready",
        locale: parsed.data.locale,
        vars: shopOrderReadyMailVars(parsed.data.locale, token),
      });
    }
  }

  revalidateShopOrderViews(parsed.data.locale);
  return { ok: true };
}

export async function assignAdminShopOrder(
  raw: z.infer<typeof assignSchema>,
): Promise<ShopOrderActionResult> {
  const parsed = assignSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const admin = await requireMerchAdmin();
  if (!admin.ok) return admin;

  const studentId = parsed.data.studentId?.trim() || null;
  const { data: row } = await admin.supabase
    .from("shop_orders")
    .select("status, buyer_id")
    .eq("id", parsed.data.orderId)
    .maybeSingle();
  const status = parseShopOrderStatus(String(row?.status ?? ""));
  if (!row || !status) return { ok: false, code: "not_found" };
  if (!isAssignableShopOrderStatus(status)) return { ok: false, code: "illegal_status" };

  if (studentId) {
    const { data: profile } = await admin.supabase
      .from("profiles")
      .select("role")
      .eq("id", studentId)
      .maybeSingle();
    if (profile?.role !== "student") return { ok: false, code: "invalid_input" };
  }

  if (
    !mayAssignShopOrder({
      actorRole: "admin",
      actorId: admin.user.id,
      buyerId: String(row.buyer_id),
      childIds: studentId ? [studentId] : [],
      studentId,
    })
  ) {
    return { ok: false, code: "forbidden" };
  }

  const { error } = await admin.supabase
    .from("shop_orders")
    .update({ assignee_student_id: studentId })
    .eq("id", parsed.data.orderId);
  if (error) return { ok: false, code: "save_failed" };
  revalidateShopOrderViews(parsed.data.locale);
  return { ok: true };
}

function revalidateShopOrderViews(locale: string): void {
  revalidatePath(`/${locale}/dashboard/admin/merch/orders`);
  revalidatePath(`/${locale}/dashboard/parent/shop/orders`);
  revalidatePath(`/${locale}/dashboard/student/shop/orders`);
}
