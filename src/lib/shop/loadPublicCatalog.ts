import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { shopProductImagePublicUrl } from "@/lib/shop/shopMedia";
import {
  mapPublicCatalog,
  mapPublicProduct,
  normalizeShopProductRow,
  type PublicCatalogCard,
  type PublicProductDetail,
} from "@/lib/shop/mapPublicCatalog";

const CATALOG_SELECT =
  "id, slug, title, description, image_path, active, shop_product_variants(id, active, stock, price, size, color)";

const CATALOG_LIMIT = 48;

export async function loadPublicCatalog(): Promise<PublicCatalogCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_products")
    .select(CATALOG_SELECT)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(CATALOG_LIMIT);
  if (error) {
    logSupabaseClientError("loadPublicCatalog", error);
    return [];
  }
  return mapPublicCatalog((data ?? []).map(normalizeShopProductRow)).map((card) => ({
    ...card,
    imageUrl: shopProductImagePublicUrl(card.imageUrl),
  }));
}

export async function loadPublicProduct(id: string): Promise<PublicProductDetail | null> {
  const productId = id.trim();
  if (!productId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_products")
    .select(CATALOG_SELECT)
    .eq("id", productId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("loadPublicProduct", error, { id: productId });
    return null;
  }
  if (!data) return null;
  const product = mapPublicProduct(normalizeShopProductRow(data));
  if (!product) return null;
  return { ...product, imageUrl: shopProductImagePublicUrl(product.imageUrl) };
}

const PRODUCT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolvePublicShopProduct(key: string): Promise<{
  product: PublicProductDetail;
  canonicalSlug: string;
} | null> {
  const trimmed = key.trim();
  if (!trimmed) return null;
  if (PRODUCT_UUID.test(trimmed)) {
    const product = await loadPublicProduct(trimmed);
    if (!product) return null;
    return { product, canonicalSlug: product.slug || trimmed };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_products")
    .select(CATALOG_SELECT)
    .eq("slug", trimmed)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("resolvePublicShopProduct", error, { slug: trimmed });
    return null;
  }
  if (data) {
    const mapped = mapPublicProduct(normalizeShopProductRow(data));
    if (!mapped) return null;
    const product = { ...mapped, imageUrl: shopProductImagePublicUrl(mapped.imageUrl) };
    return { product, canonicalSlug: product.slug };
  }
  const alias = await supabase
    .from("shop_product_slug_aliases")
    .select("product_id")
    .eq("slug", trimmed)
    .maybeSingle();
  if (alias.error) {
    logSupabaseClientError("resolvePublicShopProduct.alias", alias.error, { slug: trimmed });
    return null;
  }
  const productId = alias.data?.product_id ? String(alias.data.product_id) : "";
  if (!productId) return null;
  const product = await loadPublicProduct(productId);
  if (!product) return null;
  return { product, canonicalSlug: product.slug || productId };
}
