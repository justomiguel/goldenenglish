import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPublicCatalog } from "@/lib/shop/loadPublicCatalog";
import { requireShopPortal } from "@/lib/shop/requireShopPortal";
import { PublicShopCatalog } from "@/components/shop/PublicShopCatalog";
import { FamilyShopNav } from "@/components/shop/FamilyShopNav";
import { FamilyShopSurfaceEntry } from "@/components/shop/FamilyShopSurfaceEntry";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return { title: dict.shop.catalog.title };
}

export default async function ParentShopCatalogPage({ params }: PageProps) {
  const { locale } = await params;
  const [{ dict }, rows] = await Promise.all([
    requireShopPortal(locale, "parent"),
    loadPublicCatalog(),
  ]);
  return (
    <FamilyShopSurfaceEntry>
      <div className="space-y-4">
        <FamilyShopNav locale={locale} labels={dict.shop.family} current="catalog" />
        <PublicShopCatalog locale={locale} rows={rows} labels={dict.shop.catalog} />
      </div>
    </FamilyShopSurfaceEntry>
  );
}
