export type PublicCatalogVariantSource = {
  id: string;
  active: boolean;
  stock: number;
  price: number;
  size: string;
  color: string;
};

export type PublicCatalogProductSource = {
  id: string;
  slug?: string;
  title: string;
  image_path: string | null;
  active: boolean;
  variants: PublicCatalogVariantSource[];
};

export type PublicCatalogCard = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  soldOut: boolean;
};

export type PublicProductSource = PublicCatalogProductSource & {
  description?: string;
};

export type PublicProductVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
  price: number;
};

export type PublicProductDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  soldOut: boolean;
  variants: PublicProductVariant[];
};

function isBuyableVariant(variant: PublicCatalogVariantSource): boolean {
  return variant.active && variant.stock > 0;
}

export function normalizeShopProductRow(row: {
  id: string;
  slug?: string | null;
  title: string;
  image_path: string | null;
  active: boolean;
  description?: string | null;
  shop_product_variants?: PublicCatalogVariantSource[] | null;
}): PublicProductSource {
  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title,
    image_path: row.image_path,
    active: row.active,
    description: row.description ?? "",
    variants: row.shop_product_variants ?? [],
  };
}

export function mapPublicCatalog(rows: PublicCatalogProductSource[]): PublicCatalogCard[] {
  return rows
    .filter((row) => row.active)
    .map((row) => ({
      id: row.id,
      slug: row.slug ?? "",
      title: row.title,
      imageUrl: row.image_path,
      soldOut: !row.variants.some(isBuyableVariant),
    }));
}

export function mapPublicProduct(row: PublicProductSource): PublicProductDetail | null {
  if (!row.active) return null;
  const variants = row.variants
    .filter((variant) => variant.active)
    .map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      stock: Number(variant.stock),
      price: Number(variant.price),
    }));
  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title,
    description: row.description ?? "",
    imageUrl: row.image_path,
    soldOut: variants.length === 0 || variants.every((variant) => variant.stock === 0),
    variants,
  };
}
