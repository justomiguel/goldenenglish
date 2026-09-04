import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadShopOrderByPayToken } from "@/lib/shop/loadShopOrderByPayToken";
import { ShopOrderStatus } from "@/components/shop/ShopOrderStatus";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return { title: dict.shop.order.title, robots: { index: false, follow: false } };
}

export default async function ShopOrderTokenPage({ params }: PageProps) {
  const { locale, token } = await params;
  const order = await loadShopOrderByPayToken(token);
  if (!order) notFound();

  const dict = await getDictionary(locale);
  return <ShopOrderStatus locale={locale} order={order} labels={dict.shop.order} />;
}
