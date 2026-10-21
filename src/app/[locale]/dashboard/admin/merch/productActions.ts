"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  merchLocaleSchema,
  revalidateMerchPaths,
  requireMerchAdmin,
  type MerchActionResult,
} from "@/app/[locale]/dashboard/admin/merch/merchActionShared";
import {
  planShopProductSlug,
  retireShopProductSlug,
} from "@/lib/shop/server/planShopProductSlug";

const createSchema = z.object({
  locale: merchLocaleSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).optional(),
  sortOrder: z.number().int().optional(),
  imagePath: z.string().max(500).nullable().optional(),
});

const updateSchema = createSchema.extend({
  id: z.string().uuid(),
});

const toggleSchema = z.object({
  locale: merchLocaleSchema,
  id: z.string().uuid(),
  active: z.boolean(),
});

export async function createShopProduct(raw: unknown): Promise<MerchActionResult> {
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const admin = await requireMerchAdmin();
  if (!admin.ok) return admin;

  const planned = await planShopProductSlug(admin.supabase, parsed.data.title, null, null);
  if (!planned) return { ok: false, code: "save_failed" };
  const row = {
    title: parsed.data.title,
    description: parsed.data.description?.trim() ?? "",
    image_path: parsed.data.imagePath ?? null,
    slug: planned.slug,
    active: false,
    sort_order: parsed.data.sortOrder ?? 0,
  };
  const { data, error } = await admin.supabase
    .from("shop_products")
    .insert(row)
    .select("id")
    .single();
  if (error || !data?.id) {
    logSupabaseClientError("createShopProduct", error, { title: row.title });
    return { ok: false, code: "save_failed" };
  }
  void recordSystemAudit({
    action: "shop_product_create",
    resourceType: "shop_product",
    resourceId: data.id,
    payload: { title: row.title, active: false },
  });
  revalidateMerchPaths(parsed.data.locale);
  return { ok: true, id: data.id as string };
}

export async function updateShopProduct(raw: unknown): Promise<MerchActionResult> {
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const admin = await requireMerchAdmin();
  if (!admin.ok) return admin;

  const { id, locale, title, description, sortOrder, imagePath } = parsed.data;
  const { data: current, error: currentError } = await admin.supabase
    .from("shop_products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (currentError || !current) {
    logSupabaseClientError("updateShopProduct.slug", currentError, { id });
    return { ok: false, code: "save_failed" };
  }
  const currentSlug = String(current.slug ?? "");
  const planned = await planShopProductSlug(admin.supabase, title, id, currentSlug);
  if (!planned) return { ok: false, code: "save_failed" };
  const retired = await retireShopProductSlug(admin.supabase, id, planned.retire, planned.slug);
  if (!retired) return { ok: false, code: "save_failed" };
  const patch: Record<string, unknown> = {
    title,
    description: description?.trim() ?? "",
    slug: planned.slug,
  };
  if (sortOrder !== undefined) patch.sort_order = sortOrder;
  if (imagePath !== undefined) patch.image_path = imagePath;

  const { error } = await admin.supabase.from("shop_products").update(patch).eq("id", id);
  if (error) {
    logSupabaseClientError("updateShopProduct", error, { id });
    return { ok: false, code: "save_failed" };
  }
  void recordSystemAudit({
    action: "shop_product_update",
    resourceType: "shop_product",
    resourceId: id,
    payload: { title },
  });
  revalidateMerchPaths(locale);
  return { ok: true, id };
}

export async function toggleShopProductActive(raw: unknown): Promise<MerchActionResult> {
  const parsed = toggleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const admin = await requireMerchAdmin();
  if (!admin.ok) return admin;

  const { id, locale, active } = parsed.data;
  if (active) {
    const { data } = await admin.supabase
      .from("shop_product_variants")
      .select("id")
      .eq("product_id", id)
      .limit(1)
      .maybeSingle();
    if (!data) return { ok: false, code: "no_variants" };
  }

  const { error } = await admin.supabase.from("shop_products").update({ active }).eq("id", id);
  if (error) {
    logSupabaseClientError("toggleShopProductActive", error, { id, active });
    return { ok: false, code: "save_failed" };
  }
  void recordSystemAudit({
    action: "shop_product_toggle_active",
    resourceType: "shop_product",
    resourceId: id,
    payload: { active },
  });
  revalidateMerchPaths(locale);
  return { ok: true, id };
}
