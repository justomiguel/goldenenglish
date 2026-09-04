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
  "id, title, description, image_path, active, shop_product_variants(id, active, stock, price, size, color)";

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
