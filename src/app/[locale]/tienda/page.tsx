import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPublicCatalog } from "@/lib/shop/loadPublicCatalog";
import { PublicShopCatalog } from "@/components/shop/PublicShopCatalog";
import { getBrandForRequest } from "@/lib/brand/server";
import { buildResolvedPublicShareMetadata } from "@/lib/site/buildResolvedPublicShareMetadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [dict, brand] = await Promise.all([getDictionary(locale), getBrandForRequest()]);
  return buildResolvedPublicShareMetadata({
    what: dict.shop.catalog.title,
    academyName: brand.name,
    description: dict.shop.catalog.lead,
    path: `/${locale}/tienda`,
  });
}

export default async function PublicShopCatalogPage({ params }: PageProps) {
  const { locale } = await params;
  const [dict, rows] = await Promise.all([getDictionary(locale), loadPublicCatalog()]);
  return <PublicShopCatalog locale={locale} rows={rows} labels={dict.shop.catalog} />;
}
