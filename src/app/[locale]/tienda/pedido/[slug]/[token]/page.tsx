import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { loadShopOrderByPayToken } from "@/lib/shop/loadShopOrderByPayToken";
import { ShopOrderStatus } from "@/components/shop/ShopOrderStatus";
import { buildResolvedPublicShareMetadata } from "@/lib/site/buildResolvedPublicShareMetadata";
import { buildShopOrderPath } from "@/lib/site/publicSharePaths";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; slug: string; token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, token } = await params;
  const [dict, brand, order] = await Promise.all([
    getDictionary(locale),
    getBrandForRequest(),
    loadShopOrderByPayToken(token),
  ]);
  const title = order?.items[0]?.title || dict.shop.order.title;
  return buildResolvedPublicShareMetadata({
    what: title,
    academyName: brand.name,
    description: dict.socialShare.shopOrderDescription,
    path: buildShopOrderPath(locale, title, token),
    robots: { index: false, follow: false },
  });
}

export default async function ShopOrderTokenPage({ params }: PageProps) {
  const { locale, slug, token } = await params;
  const order = await loadShopOrderByPayToken(token);
  if (!order) notFound();
  const title = order.items[0]?.title ?? "";
  const canonical = buildShopOrderPath(locale, title, token);
  if (`/${locale}/tienda/pedido/${slug}/${token}` !== canonical) permanentRedirect(canonical);

  const dict = await getDictionary(locale);
  return <ShopOrderStatus locale={locale} order={order} labels={dict.shop.order} />;
}
