import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { resolvePublicShopProduct } from "@/lib/shop/loadPublicCatalog";
import { PublicShopProduct } from "@/components/shop/PublicShopProduct";
import { buildResolvedPublicShareMetadata } from "@/lib/site/buildResolvedPublicShareMetadata";
import { buildShopProductPath } from "@/lib/site/publicSharePaths";

interface PageProps {
  params: Promise<{ locale: string; productId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, productId } = await params;
  const [dict, brand, resolved] = await Promise.all([
    getDictionary(locale),
    getBrandForRequest(),
    resolvePublicShopProduct(productId),
  ]);
  return buildResolvedPublicShareMetadata({
    what: resolved?.product.title ?? dict.shop.catalog.title,
    academyName: brand.name,
    description: resolved?.product.description || dict.shop.catalog.lead,
    path: buildShopProductPath(locale, resolved?.canonicalSlug || productId),
    pageImageUrl: resolved?.product.imageUrl,
  });
}

export default async function PublicShopProductPage({ params }: PageProps) {
  const { locale, productId } = await params;
  const resolved = await resolvePublicShopProduct(productId);
  if (!resolved) notFound();
  if (productId !== resolved.canonicalSlug) {
    permanentRedirect(buildShopProductPath(locale, resolved.canonicalSlug));
  }
  const { product } = resolved;

  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const { currency } = await loadBillingCurrencySetting(supabase);

  return (
    <PublicShopProduct
      locale={locale}
      currency={currency}
      product={product}
      labels={dict.shop.product}
    />
  );
}
