import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPublicCatalog } from "@/lib/shop/loadPublicCatalog";
import { PublicShopCatalog } from "@/components/shop/PublicShopCatalog";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return { title: dict.shop.catalog.title };
}

export default async function PublicShopCatalogPage({ params }: PageProps) {
  const { locale } = await params;
  const [dict, rows] = await Promise.all([getDictionary(locale), loadPublicCatalog()]);
  return <PublicShopCatalog locale={locale} rows={rows} labels={dict.shop.catalog} />;
}
