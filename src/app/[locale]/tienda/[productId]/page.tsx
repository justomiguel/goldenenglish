import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { loadPublicProduct } from "@/lib/shop/loadPublicCatalog";
import { PublicShopProduct } from "@/components/shop/PublicShopProduct";

interface PageProps {
  params: Promise<{ locale: string; productId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, productId } = await params;
  const [dict, product] = await Promise.all([getDictionary(locale), loadPublicProduct(productId)]);
  return { title: product?.title ?? dict.shop.catalog.title };
}

export default async function PublicShopProductPage({ params }: PageProps) {
  const { locale, productId } = await params;
  const product = await loadPublicProduct(productId);
  if (!product) notFound();

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
