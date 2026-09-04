"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  isUniqueViolation,
  merchLocaleSchema,
  revalidateMerchPaths,
  requireMerchAdmin,
  type MerchActionResult,
} from "@/app/[locale]/dashboard/admin/merch/merchActionShared";

const upsertSchema = z.object({
  locale: merchLocaleSchema,
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  size: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(80),
  sku: z.string().trim().min(1).max(80),
  stock: z.number().int(),
  price: z.number(),
  active: z.boolean().optional(),
});

const idSchema = z.object({
  locale: merchLocaleSchema,
  id: z.string().uuid(),
});

function variantFieldError(stock: number, price: number): MerchActionResult | null {
  if (stock < 0) return { ok: false, code: "invalid_stock" };
  if (price <= 0) return { ok: false, code: "invalid_price" };
  return null;
}

export async function upsertShopVariant(raw: unknown): Promise<MerchActionResult> {
  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) {
    const stock = typeof (raw as { stock?: unknown })?.stock === "number" ? (raw as { stock: number }).stock : null;
    const price = typeof (raw as { price?: unknown })?.price === "number" ? (raw as { price: number }).price : null;
    if (stock !== null && stock < 0) return { ok: false, code: "invalid_stock" };
    if (price !== null && price <= 0) return { ok: false, code: "invalid_price" };
    return { ok: false, code: "invalid_input" };
  }
  const fieldErr = variantFieldError(parsed.data.stock, parsed.data.price);
  if (fieldErr) return fieldErr;

  const admin = await requireMerchAdmin();
  if (!admin.ok) return admin;

  const row = {
    product_id: parsed.data.productId,
    size: parsed.data.size,
    color: parsed.data.color,
    sku: parsed.data.sku,
    stock: parsed.data.stock,
    price: parsed.data.price,
    active: parsed.data.active ?? true,
  };

  const query = parsed.data.id
    ? admin.supabase.from("shop_product_variants").update(row).eq("id", parsed.data.id).select("id").single()
    : admin.supabase.from("shop_product_variants").insert(row).select("id").single();

  const { data, error } = await query;
  if (isUniqueViolation(error)) return { ok: false, code: "duplicate_variant" };
  if (error || !data?.id) {
    logSupabaseClientError("upsertShopVariant", error, { productId: parsed.data.productId });
    return { ok: false, code: "save_failed" };
  }
  void recordSystemAudit({
    action: parsed.data.id ? "shop_variant_update" : "shop_variant_create",
    resourceType: "shop_product_variant",
    resourceId: data.id,
    payload: { productId: parsed.data.productId, sku: row.sku },
  });
  revalidateMerchPaths(parsed.data.locale);
  return { ok: true, id: data.id as string };
}

export async function deleteShopVariant(raw: unknown): Promise<MerchActionResult> {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const admin = await requireMerchAdmin();
  if (!admin.ok) return admin;

  const { data: used } = await admin.supabase
    .from("shop_order_items")
    .select("id")
    .eq("variant_id", parsed.data.id)
    .limit(1)
    .maybeSingle();
  if (used) return { ok: false, code: "archive_only" };

  const { error } = await admin.supabase
    .from("shop_product_variants")
    .delete()
    .eq("id", parsed.data.id);
  if (error) {
    logSupabaseClientError("deleteShopVariant", error, { id: parsed.data.id });
    return { ok: false, code: "save_failed" };
  }
  void recordSystemAudit({
    action: "shop_variant_delete",
    resourceType: "shop_product_variant",
    resourceId: parsed.data.id,
  });
  revalidateMerchPaths(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}

export async function archiveShopVariant(raw: unknown): Promise<MerchActionResult> {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const admin = await requireMerchAdmin();
  if (!admin.ok) return admin;

  const { error } = await admin.supabase
    .from("shop_product_variants")
    .update({ active: false })
    .eq("id", parsed.data.id);
  if (error) {
    logSupabaseClientError("archiveShopVariant", error, { id: parsed.data.id });
    return { ok: false, code: "save_failed" };
  }
  void recordSystemAudit({
    action: "shop_variant_archive",
    resourceType: "shop_product_variant",
    resourceId: parsed.data.id,
  });
  revalidateMerchPaths(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}
