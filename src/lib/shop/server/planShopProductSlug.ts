import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { allocateShopSlug } from "@/lib/shop/allocateShopSlug";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const SLUG_CAP = 500;

type SlugRow = { id?: string; product_id?: string; slug?: string | null };

/** Merch catalogs stay small. The cap avoids an unbounded scan. */
export async function planShopProductSlug(
  supabase: SupabaseClient,
  title: string,
  productId: string | null,
  currentSlug: string | null,
): Promise<{ slug: string; retire: string | null } | null> {
  const [products, aliases] = await Promise.all([
    supabase.from("shop_products").select("id, slug").limit(SLUG_CAP),
    supabase.from("shop_product_slug_aliases").select("product_id, slug").limit(SLUG_CAP),
  ]);
  if (products.error || aliases.error) {
    logSupabaseClientError("planShopProductSlug", products.error ?? aliases.error, {
      productId,
    });
    return null;
  }
  const taken = new Set<string>();
  for (const row of (products.data ?? []) as SlugRow[]) {
    if (productId && row.id === productId) continue;
    if (row.slug) taken.add(row.slug);
  }
  for (const row of (aliases.data ?? []) as SlugRow[]) {
    if (productId && row.product_id === productId) continue;
    if (row.slug) taken.add(row.slug);
  }
  return allocateShopSlug(title, taken, currentSlug);
}

export async function retireShopProductSlug(
  supabase: SupabaseClient,
  productId: string,
  retire: string | null,
  nextSlug: string,
): Promise<boolean> {
  if (retire) {
    const { error } = await supabase
      .from("shop_product_slug_aliases")
      .insert({ product_id: productId, slug: retire });
    if (error && error.code !== "23505") {
      logSupabaseClientError("retireShopProductSlug", error, { productId });
      return false;
    }
  }
  const { error: dropError } = await supabase
    .from("shop_product_slug_aliases")
    .delete()
    .eq("product_id", productId)
    .eq("slug", nextSlug);
  if (dropError) {
    logSupabaseClientError("retireShopProductSlug.drop", dropError, { productId });
    return false;
  }
  return true;
}
