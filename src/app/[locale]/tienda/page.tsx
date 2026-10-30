import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPublicCatalog } from "@/lib/shop/loadPublicCatalog";
import { loadPublicCourses } from "@/lib/courses/loadPublicCourses";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const [dict, rows, courses, billing] = await Promise.all([
    getDictionary(locale),
    loadPublicCatalog(),
    loadPublicCourses(supabase),
    loadBillingCurrencySetting(supabase),
  ]);
  const price = new Intl.NumberFormat(locale, { style: "currency", currency: billing.currency });
  return (
    <PublicShopCatalog
      locale={locale}
      rows={rows}
      courses={courses.map((course) => ({ ...course, priceLabel: price.format(course.price) }))}
      labels={dict.shop.catalog}
    />
  );
}
